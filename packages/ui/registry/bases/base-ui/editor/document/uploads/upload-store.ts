import {
  closeHistory,
  dropPoint,
  Extension,
  facadeFor,
  Fragment,
  Plugin,
  PluginKey,
  Slice,
  type Editor,
  type EngineHandle,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { acceptScore, uploadRefusal, type EditorUpload, type UploadLimits, type UploadMessages } from './upload';

interface UploadEntryBase {
  readonly id: number;
  /** Where the block the upload lands in starts, mapped through every change of the document. */
  readonly pos: number;
  /** Which of the block's addresses it fills, such as `src` or `icons.2.icon`. */
  readonly slot: string;
  readonly file: File;
  /** A local address of the file the editor draws while it uploads, never stored; null for a file not drawn. */
  readonly preview: string | null;
  /** Whether a paste or a drop made the block for it, so a cancel takes the block away again. */
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
  /** The attributes written on the block once `url` answers, read from its attributes then. */
  land(attrs: Readonly<Record<string, unknown>>, url: string, file: File): Record<string, unknown>;
  /** What is wrong with an answered address, as a typed one is checked; the upload fails with the first. */
  problems?(url: string): readonly string[];
}

/** A block a pasted or dropped file becomes, offered by the feature that draws it. */
export interface UploadTaker {
  /** The types it takes; a file goes to the taker that names its type closest. */
  readonly accept: string;
  /** Which of the block's addresses the file fills. */
  readonly slot: string;
  /** The empty block the file becomes, or null where the editor holds none for it. */
  node(engine: Editor, file: File): ProseMirrorNode | null;
  request(): UploadRequest;
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

interface UploadRecord {
  entry: UploadEntry;
  request: UploadRequest;
  controller: AbortController | null;
  /** The transaction that inserted the block, whose positions the entry already has. */
  since: object | null;
}

interface UploadStoreInternals extends UploadStore {
  takers: UploadTaker[];
  map(tr: TransactionLike, before: ProseMirrorNode, after: ProseMirrorNode): void;
  take(files: readonly File[], at: number | null): boolean;
  destroy(): void;
}

type TransactionLike = {
  readonly docChanged: boolean;
  readonly mapping: { map(pos: number, assoc?: number): number };
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
    record.controller = null;
    changed();
  };

  const land = (record: UploadRecord, url: string): void => {
    const { pos, file } = record.entry;
    const node = engine.isDestroyed ? null : engine.state.doc.nodeAt(pos);
    release(record, false);
    if (!node) return;
    const tr = engine.state.tr;
    for (const [name, value] of Object.entries(record.request.land(node.attrs, url, file))) {
      tr.setNodeAttribute(pos, name, value);
    }
    // Its own undo step, whatever the author typed just before it landed.
    engine.view.dispatch(closeHistory(tr));
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
          const progress = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
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
      };
      records.set(record.entry.id, record);
      run(record);
      return null;
    },
    cancel(id) {
      const record = records.get(id);
      if (!record) return;
      release(record, true);
      if (!record.entry.created || engine.isDestroyed) return;
      const { pos } = record.entry;
      const node = engine.state.doc.nodeAt(pos);
      if (!node) return;
      // The block came with the paste or the drop; it goes as if neither had made it, leaving no step to redo.
      engine.view.dispatch(engine.state.tr.delete(pos, pos + node.nodeSize).setMeta('addToHistory', false));
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
        const from = tr.mapping.map(pos, 1);
        const to = tr.mapping.map(pos + old.nodeSize, -1);
        const now = after.nodeAt(from);
        if (!now || now.type !== old.type || from + now.nodeSize !== to) lost.push(record);
        else if (from !== pos) {
          record.entry = { ...record.entry, pos: from };
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
      const tr = engine.state.tr;
      const made: { node: ProseMirrorNode; taker: UploadTaker; file: File }[] = [];
      let point = at;
      for (const file of files) {
        const taker = best(file);
        const node = taker?.node(engine, file);
        if (!taker || !node) continue;
        if (point === null) tr.replaceSelectionWith(node, false);
        else {
          const spot = dropPoint(tr.doc, point, new Slice(Fragment.from(node), 0, 0)) ?? point;
          tr.insert(spot, node);
          point = spot + node.nodeSize;
        }
        made.push({ node, taker, file });
      }
      if (made.length === 0) return false;
      const fresh: UploadRecord[] = [];
      for (const { node, taker, file } of made) {
        const pos = positionOf(tr.doc, node);
        if (pos === undefined) continue;
        const request = taker.request();
        const refusal = uploadRefusal(file, request.accept, request.limits, request.messages);
        const record: UploadRecord = {
          entry: entryOf(pos, taker.slot, file, request, true, refusal),
          request,
          controller: null,
          since: tr,
        };
        records.set(record.entry.id, record);
        fresh.push(record);
      }
      const before = engine.state.doc;
      engine.view.dispatch(tr.scrollIntoView());
      for (const record of fresh) record.since = null;
      // The editor refused the blocks, as a locked email does.
      if (engine.state.doc === before) {
        for (const record of fresh) release(record, false);
        return true;
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
              const files = [...(event.clipboardData?.files ?? [])];
              return files.length > 0 && storeFor(engine).take(files, null);
            },
            handleDrop(view, event, _slice, moved) {
              if (moved) return false;
              if (onDropZone(event)) return true;
              const files = [...(event.dataTransfer?.files ?? [])];
              if (files.length === 0) return false;
              const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
              return storeFor(engine).take(files, at?.pos ?? view.state.selection.to);
            },
          },
        }),
      ];
    },
  });
}
