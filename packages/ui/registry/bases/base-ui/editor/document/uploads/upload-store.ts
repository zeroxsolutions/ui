import {
  closeHistory,
  dropPoint,
  Extension,
  facadeFor,
  Fragment,
  Plugin,
  PluginKey,
  Slice,
  undo,
  type Editor,
  type EngineHandle,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  acceptScore,
  uploadMessagesOf,
  uploadRefusal,
  type BlockUploadOptions,
  type EditorUpload,
  type UploadLimits,
  type UploadMessages,
} from './upload';

interface UploadEntryBase {
  readonly id: number;
  /** Where the block the upload lands in starts, mapped through every change of the document. */
  readonly pos: number;
  /** Which of the block's addresses it fills, such as `src` or `icons.2.icon`. */
  readonly slot: string;
  readonly file: File;
  /** A local address of the file the editor draws while it uploads, never stored; null for a file not drawn. */
  readonly preview: string | null;
  /** Whether a paste or a drop made the block for it, so a cancel puts back what was there before. */
  readonly created: boolean;
}

/** An upload in flight or failed, held outside the document. */
export type UploadEntry =
  | (UploadEntryBase & {
      readonly phase: 'uploading';
      /** How much is sent, from 0 to 1; null before the host reports any. */
      readonly progress: number | null;
    })
  | (UploadEntryBase & {
      readonly phase: 'failed';
      readonly message: string;
      /** False where the file or the address answered is refused, which a second try would not change. */
      readonly retryable: boolean;
    });

/** What one block's upload is run with. */
export interface UploadRequest {
  readonly upload: EditorUpload;
  /** The types the block takes, as an `<input accept>` lists them; `''` for any. */
  readonly accept: string;
  readonly limits: UploadLimits;
  readonly messages: UploadMessages;
  /** Whether the file is drawn from a local address while it uploads, as an image is. */
  readonly preview: boolean;
  /** The attributes written on the block once `url` answers, read from its attributes then and the slot it fills. */
  land(attrs: Readonly<Record<string, unknown>>, url: string, file: File, slot: string): Record<string, unknown>;
  /**
   * Where `slot` is once the block's attributes change from `before` to `after`, as an item's place shifts when
   * one before it is removed; null where what it fills is gone, which ends the upload. The slot stays when absent.
   */
  follow?(
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    slot: string,
  ): string | null;
  /** What is wrong with an answered address, as a typed one is checked; the upload fails with the first. */
  problems?(url: string): readonly string[];
}

/**
 * The request a feature's block uploads with under `options`, or null where the host gave no `upload`. `accept`
 * is the block's own types; the host's `accept` narrows them.
 */
export function blockUploadRequest(
  options: BlockUploadOptions,
  block: Pick<UploadRequest, 'accept' | 'preview' | 'land' | 'problems'>,
): UploadRequest | null {
  const { upload, accept, maxBytes } = options;
  if (!upload) return null;
  return {
    ...block,
    upload,
    limits: { accept, maxBytes },
    messages: uploadMessagesOf(options.messages),
  };
}

/** A block a pasted or dropped file becomes, offered by the feature that draws it. */
export interface UploadTaker {
  /** The types it takes; a file goes to the taker that names its type closest. */
  readonly accept: string;
  /** Which of the block's addresses the file fills. */
  readonly slot: string;
  /** The empty block the file becomes, or null where the editor holds none for it. */
  node(engine: Editor, file: File): ProseMirrorNode | null;
  /** What the block made for `file` uploads it with. */
  request(file: File): UploadRequest;
}

/** The uploads of one editor. */
export interface UploadStore {
  subscribe(listener: () => void): () => void;
  /** The upload filling `slot` of the block at `pos`, or null. */
  find(pos: number | undefined, slot: string): UploadEntry | null;
  entries(): readonly UploadEntry[];
  /** Uploads `file` into `slot` of the block at `pos`; answers why it is refused, or null once it started. */
  start(pos: number, slot: string, file: File, request: UploadRequest): string | null;
  /** Stops an upload, or drops a failed one; the block is left as it was before. */
  cancel(id: number): void;
  retry(id: number): void;
}

/** One paste or drop that made blocks for files. */
interface Take {
  /** How many blocks it made. */
  readonly blocks: number;
  /** The document right after it; the editor still holds it while nothing has changed since. */
  after: ProseMirrorNode | null;
}

interface UploadRecord {
  entry: UploadEntry;
  request: UploadRequest;
  controller: AbortController | null;
  /** The transaction that inserted the block, whose positions the entry already has. */
  since: object | null;
  /** The paste or drop that made the block, and what the block took the place of; null for a block the author made. */
  made: { readonly take: Take; readonly replaced: Slice } | null;
}

interface UploadStoreInternals extends UploadStore {
  takers: UploadTaker[];
  map(tr: TransactionLike, before: ProseMirrorNode, after: ProseMirrorNode): void;
  /** Whether the editor took a block for any of `files`. */
  take(files: readonly File[], at: number | null): boolean;
  destroy(): void;
}

type TransactionLike = {
  readonly docChanged: boolean;
  readonly mapping: {
    map(pos: number, assoc?: number): number;
    mapResult(pos: number, assoc?: number): { readonly pos: number; readonly deleted: boolean };
  };
  getMeta(key: string): unknown;
};

/** A web address, the only kind an upload's answer is stored as. */
const WEB = /^https?:\/\//i;

const stores = new Map<Editor, UploadStoreInternals>();
let nextId = 1;

function positionOf(doc: ProseMirrorNode, node: ProseMirrorNode): number | undefined {
  let found: number | undefined;
  doc.descendants((child, pos) => {
    if (child === node) found = pos;
    return found === undefined;
  });
  return found;
}

/** Where `node` itself sits in `doc`, as a drag puts the dragged node; undefined unless it sits in one place. */
function movedTo(doc: ProseMirrorNode, node: ProseMirrorNode): number | undefined {
  const found: number[] = [];
  doc.descendants((child, pos) => {
    if (child === node) found.push(pos);
    return found.length < 2;
  });
  return found.length === 1 ? found[0] : undefined;
}

function createUploadStore(engine: Editor): UploadStoreInternals {
  const records = new Map<number, UploadRecord>();
  const listeners = new Set<() => void>();
  const mapped = new WeakSet<object>();
  let snapshot: readonly UploadEntry[] = [];
  let notifying = false;

  // Listeners hear of a change after the transaction that made it, never in the middle of one.
  const changed = (): void => {
    snapshot = [...records.values()].map((record) => record.entry);
    if (notifying) return;
    notifying = true;
    queueMicrotask(() => {
      notifying = false;
      for (const listener of listeners) listener();
    });
  };

  const release = (record: UploadRecord, abort: boolean): void => {
    records.delete(record.entry.id);
    if (abort) record.controller?.abort();
    if (record.entry.preview !== null) URL.revokeObjectURL(record.entry.preview);
    changed();
  };

  const fail = (record: UploadRecord, message: string, retryable: boolean): void => {
    const { progress: _progress, ...rest } = record.entry as UploadEntryBase & { progress?: unknown };
    record.entry = { ...rest, phase: 'failed', message, retryable };
    // The failed run stops, so nothing it reports later reaches a retry.
    record.controller?.abort();
    record.controller = null;
    changed();
  };

  const land = (record: UploadRecord, url: string): void => {
    const { pos, file, slot } = record.entry;
    const node = engine.isDestroyed ? null : engine.state.doc.nodeAt(pos);
    if (!node) return release(record, false);
    const tr = engine.state.tr;
    for (const [name, value] of Object.entries(record.request.land(node.attrs, url, file, slot))) {
      tr.setNodeAttribute(pos, name, value);
    }
    const before = engine.state.doc;
    // Its own undo step, whatever the author typed just before it landed.
    engine.view.dispatch(closeHistory(tr));
    // A rule of the host's refused the change; the file stays, to be tried again.
    if (tr.docChanged && engine.state.doc === before) return fail(record, record.request.messages.failed, true);
    release(record, false);
  };

  const run = (record: UploadRecord): void => {
    const controller = new AbortController();
    const { messages } = record.request;
    const current = (): boolean => !controller.signal.aborted && records.get(record.entry.id) === record;
    const {
      message: _message,
      retryable: _retryable,
      ...rest
    } = record.entry as UploadEntryBase & {
      message?: unknown;
      retryable?: unknown;
    };
    record.entry = { ...rest, phase: 'uploading', progress: null };
    record.controller = controller;
    changed();
    let answer: Promise<{ readonly url: string }>;
    try {
      answer = record.request.upload(record.entry.file, {
        signal: controller.signal,
        onProgress: (fraction) => {
          if (!current() || record.entry.phase !== 'uploading') return;
          const progress = Number.isNaN(fraction) ? 0 : Math.min(1, Math.max(0, fraction));
          record.entry = { ...record.entry, progress };
          changed();
        },
      });
    } catch (error) {
      answer = Promise.reject(error);
    }
    Promise.resolve(answer).then(
      (result) => {
        if (!current()) return;
        const url = typeof result?.url === 'string' ? result.url.trim() : '';
        // A local or inline address would put the file itself, or a reference only this tab reads, in the document.
        if (!WEB.test(url)) return fail(record, messages.addressRefused, false);
        const problems = record.request.problems?.(url) ?? [];
        if (problems.length > 0) return fail(record, problems[0], false);
        land(record, url);
      },
      () => {
        if (current()) fail(record, messages.failed, true);
      },
    );
  };

  const entryOf = (
    pos: number,
    slot: string,
    file: File,
    request: UploadRequest,
    created: boolean,
    refusal: string | null,
  ): UploadEntry => {
    const base = {
      id: nextId++,
      pos,
      slot,
      file,
      preview: request.preview && refusal === null ? URL.createObjectURL(file) : null,
      created,
    };
    return refusal === null
      ? { ...base, phase: 'uploading', progress: null }
      : { ...base, phase: 'failed', message: refusal, retryable: false };
  };

  const store: UploadStoreInternals = {
    takers: [],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    find(pos, slot) {
      if (pos === undefined) return null;
      return snapshot.find((entry) => entry.pos === pos && entry.slot === slot) ?? null;
    },
    entries: () => snapshot,
    start(pos, slot, file, request) {
      const refusal = uploadRefusal(file, request.accept, request.limits, request.messages);
      if (refusal !== null) return refusal;
      for (const record of [...records.values()]) {
        if (record.entry.pos === pos && record.entry.slot === slot) release(record, true);
      }
      const record: UploadRecord = {
        entry: entryOf(pos, slot, file, request, false, null),
        request,
        controller: null,
        since: null,
        made: null,
      };
      records.set(record.entry.id, record);
      run(record);
      return null;
    },
    cancel(id) {
      const record = records.get(id);
      if (!record) return;
      release(record, true);
      if (!record.made || engine.isDestroyed) return;
      const { pos } = record.entry;
      const node = engine.state.doc.nodeAt(pos);
      if (!node) return;
      const { take, replaced } = record.made;
      // The block came with the paste or the drop. Untouched since, and alone in it, the paste or the drop is undone.
      if (take.blocks === 1 && take.after === engine.state.doc && undo(engine.state, engine.view.dispatch)) return;
      // Otherwise what it replaced comes back in its place, a step the author can undo.
      engine.view.dispatch(engine.state.tr.replace(pos, pos + node.nodeSize, replaced));
    },
    retry(id) {
      const record = records.get(id);
      if (record?.entry.phase === 'failed' && record.entry.retryable) run(record);
    },
    map(tr, before, after) {
      if (!tr.docChanged || mapped.has(tr)) return;
      mapped.add(tr);
      const lost: UploadRecord[] = [];
      let moved = false;
      for (const record of records.values()) {
        if (record.since === tr) {
          record.since = null;
          continue;
        }
        const { pos } = record.entry;
        const old = before.nodeAt(pos);
        if (!old) {
          lost.push(record);
          continue;
        }
        // The node's start and end, each kept on the node's side; a deleted node maps to an empty range.
        const start = tr.mapping.mapResult(pos, 1);
        const to = tr.mapping.map(pos + old.nodeSize, -1);
        const now = after.nodeAt(start.pos);
        const inPlace = now !== null && now.type === old.type && start.pos + now.nodeSize === to;
        // A node changed in place by its attributes is replaced as a paste over it is; only the paste, a drop or a
        // cut is the author's, so only they end the upload.
        const replaced = start.deleted && tr.getMeta('uiEvent') !== undefined;
        // A drag deletes the node and inserts that same node where it drops.
        const next = inPlace && !replaced ? start.pos : movedTo(after, old);
        const attrs = next === undefined ? undefined : after.nodeAt(next)?.attrs;
        const { follow } = record.request;
        const slot =
          attrs === undefined
            ? null
            : follow && attrs !== old.attrs
              ? follow(old.attrs, attrs, record.entry.slot)
              : record.entry.slot;
        if (next === undefined || slot === null) lost.push(record);
        else if (next !== pos || slot !== record.entry.slot) {
          record.entry = { ...record.entry, pos: next, slot };
          moved = true;
        }
      }
      for (const record of lost) records.delete(record.entry.id);
      if (lost.length > 0 || moved) changed();
      // Aborted after the transaction, since the host's abort handler may change the editor.
      if (lost.length > 0) {
        queueMicrotask(() => {
          for (const record of lost) release(record, true);
        });
      }
    },
    take(files, at) {
      const best = (file: File): UploadTaker | null => {
        let top: UploadTaker | null = null;
        let score = 0;
        for (const taker of store.takers) {
          const next = acceptScore(taker.accept, file);
          if (next > score) {
            top = taker;
            score = next;
          }
        }
        return top;
      };
      // Marked as the author's paste or drop, so an upload into a block it replaces ends.
      const tr = engine.state.tr.setMeta('uiEvent', at === null ? 'paste' : 'drop');
      const made: { node: ProseMirrorNode; taker: UploadTaker; file: File; replaced: Slice }[] = [];
      let point = at;
      for (const file of files) {
        const taker = best(file);
        const node = taker?.node(engine, file);
        if (!taker || !node) continue;
        let replaced = Slice.empty;
        if (point === null) {
          replaced = tr.selection.content();
          tr.replaceSelectionWith(node, false);
          // The next file goes after this one rather than replacing it, as the selection now picks it.
          const at = positionOf(tr.doc, node);
          point = at === undefined ? null : at + node.nodeSize;
        } else {
          const spot = dropPoint(tr.doc, point, new Slice(Fragment.from(node), 0, 0)) ?? point;
          tr.insert(spot, node);
          point = spot + node.nodeSize;
        }
        made.push({ node, taker, file, replaced });
      }
      if (made.length === 0) return false;
      const take: Take = { blocks: made.length, after: null };
      const fresh: UploadRecord[] = [];
      for (const { node, taker, file, replaced } of made) {
        const pos = positionOf(tr.doc, node);
        if (pos === undefined) continue;
        const request = taker.request(file);
        const refusal = uploadRefusal(file, request.accept, request.limits, request.messages);
        const record: UploadRecord = {
          entry: entryOf(pos, taker.slot, file, request, true, refusal),
          request,
          controller: null,
          since: tr,
          made: { take, replaced },
        };
        records.set(record.entry.id, record);
        fresh.push(record);
      }
      const before = engine.state.doc;
      // An undo step of its own, so undoing it on cancel keeps what the author typed just before.
      engine.view.dispatch(closeHistory(tr.scrollIntoView()));
      take.after = engine.state.doc;
      for (const record of fresh) record.since = null;
      // A record left where a new block now stands, such as a failed one, would be found before the new one.
      for (const record of [...records.values()]) {
        if (!fresh.includes(record) && fresh.some((made) => made.entry.pos === record.entry.pos)) release(record, true);
      }
      // The editor refused the blocks, as a locked email does; the paste or the drop is left to whoever is next.
      if (engine.state.doc === before) {
        for (const record of fresh) release(record, false);
        return false;
      }
      for (const record of fresh) {
        if (record.entry.phase === 'uploading') run(record);
      }
      changed();
      return true;
    },
    destroy() {
      for (const record of [...records.values()]) release(record, true);
      stores.delete(engine);
    },
  };
  return store;
}

function storeFor(engine: Editor): UploadStoreInternals {
  let store = stores.get(engine);
  if (!store) {
    store = createUploadStore(engine);
    stores.set(engine, store);
  }
  return store;
}

/** The uploads of `editor`, or null for an editor none of whose features uploads. */
export function uploadStoreOf(editor: IEditor): UploadStore | null {
  for (const [engine, store] of stores) {
    if (facadeFor(engine as unknown as EngineHandle) === editor) return store;
  }
  return null;
}

/** Whether a drop lands on an upload control's own drop zone, which takes the file itself. */
function onDropZone(event: Event): boolean {
  return event.target instanceof Element && event.target.closest('[data-slot=upload-tabs-drop-zone]') !== null;
}

/**
 * The engine extension of a feature whose blocks upload: it keeps the editor's uploads at their blocks through
 * every change, aborts each whose block is deleted and all of them when the editor is destroyed, and turns a
 * pasted or dropped file into the block of the feature that takes its type closest, `taker`'s where it is that.
 * Every feature that uploads adds its own; the editor keeps one store for all of them.
 */
export function uploadsExtension(id: string, taker: UploadTaker | null): unknown {
  return Extension.create({
    name: `uploads:${id}`,
    onBeforeCreate() {
      const store = storeFor(this.editor);
      if (taker) store.takers.push(taker);
    },
    onDestroy() {
      stores.get(this.editor)?.destroy();
    },
    addProseMirrorPlugins() {
      const engine = this.editor;
      return [
        new Plugin({
          key: new PluginKey(`uploads:${id}`),
          state: {
            init: () => null,
            apply(tr, value, before, after) {
              stores.get(engine)?.map(tr, before.doc, after.doc);
              return value;
            },
          },
          props: {
            handlePaste(_view, event) {
              const data = event.clipboardData;
              // Copied content often carries a picture of itself as a file; the content is what the author meant.
              if (!data || data.getData('text/html') !== '' || data.getData('text/plain') !== '') return false;
              const files = [...data.files];
              return files.length > 0 && storeFor(engine).take(files, null);
            },
            handleDrop(view, event, _slice, moved) {
              if (moved) return false;
              if (onDropZone(event)) return true;
              const files = [...(event.dataTransfer?.files ?? [])];
              if (files.length === 0) return false;
              const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
              storeFor(engine).take(files, at?.pos ?? view.state.selection.to);
              // Taken even where the editor refuses the blocks: a file dropped and left would open in place of the page.
              return true;
            },
          },
        }),
      ];
    },
  });
}
