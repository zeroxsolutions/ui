import { z } from 'zod';
import { Extension, Plugin, PluginKey, facadeFor } from '../../document/advanced.js';
import type { Editor, EngineHandle } from '../../document/advanced.js';
import type { EditorFeature, IEditor } from '../../document/core/types/index.js';

type EngineState = Editor['state'];
type EngineNode = EngineState['doc'];
type EngineTransaction = EngineState['tr'];

/** What a host decides about the blocks it owns; getters, so a host changes them without a remount. */
export interface BlockIdentityOptions {
  /** The ids of the blocks the author may not remove. */
  required?: () => readonly string[];
  /** `locked` lets the author edit text, variables and marks only. */
  structure?: () => 'free' | 'locked';
}

interface Block {
  node: EngineNode;
  pos: number;
}

const LANE = 'emailLane';
/** Attributes the skeleton ignores: identity's own, and the stored text an import keeps beside it. */
const UNSTRUCTURAL = new Set(['id', 'key', 'source']);
const identityKey = new PluginKey('blockIdentity');

function carriesKey(node: EngineNode): boolean {
  const attrs = node.type.spec.attrs;
  return attrs !== undefined && 'key' in attrs;
}

/** The top-level blocks and the blocks directly inside a lane, in document order; a list item is content. */
function blocksOf(doc: EngineNode): Block[] {
  const blocks: Block[] = [];
  const visit = (parent: EngineNode, contentStart: number) => {
    parent.forEach((child, offset) => {
      const pos = contentStart + offset;
      if (carriesKey(child)) blocks.push({ node: child, pos });
      child.forEach((lane, laneOffset) => {
        if (lane.type.name === LANE) visit(lane, pos + 1 + laneOffset + 1);
      });
    });
  };
  visit(doc, 0);
  return blocks;
}

function idsOf(doc: EngineNode): Set<string> {
  const ids = new Set<string>();
  for (const { node } of blocksOf(doc)) {
    if (typeof node.attrs.id === 'string') ids.add(node.attrs.id);
  }
  return ids;
}

/**
 * Types, count, order and attributes of every non-inline node. Comparing two skeletons decides locked
 * structure instead of reading the steps, because one step kind (a replace) can type a letter, split a
 * block or join two, and the skeleton tells those apart whatever command made the change.
 */
function skeletonOf(doc: EngineNode): string {
  const shape = (node: EngineNode): unknown[] => {
    const attrs = Object.entries(node.attrs).filter(([name]) => !UNSTRUCTURAL.has(name));
    const children: unknown[] = [];
    if (!node.isTextblock) {
      node.forEach((child) => {
        if (!child.isInline) children.push(shape(child));
      });
    }
    return [node.type.name, attrs, children];
  };
  return JSON.stringify(shape(doc));
}

function freshKey(taken: Set<string>): string {
  let key: string;
  do {
    key = `b${Math.random().toString(36).slice(2, 10)}`;
  } while (taken.has(key));
  taken.add(key);
  return key;
}

/** The innermost block holding the whole selection, or the block a node selection picked. */
function blockAt(state: EngineState): Block | undefined {
  const { selection } = state;
  const all = blocksOf(state.doc);
  const picked = (selection as { node?: EngineNode }).node;
  if (picked) {
    const block = all.find((candidate) => candidate.pos === selection.from && candidate.node === picked);
    if (block) return block;
  }
  const holding = all.filter(
    (candidate) => candidate.pos < selection.from && selection.to < candidate.pos + candidate.node.nodeSize,
  );
  return holding.at(-1);
}

/**
 * Gives every block (top-level or directly in a lane) a `key` unique in the document and keeps the
 * host's `id` on it across edits and moves; a pasted, duplicated or split-off block gets `id: null`
 * and a fresh key. `required` blocks cannot be removed, and `structure: 'locked'` refuses any change
 * to the blocks themselves. Adds `assignBlockIds({ ids })` (key -> id) and `deleteBlock`.
 */
export function blockIdentity(options: BlockIdentityOptions = {}): EditorFeature {
  const required = () => options.required?.() ?? [];
  const locked = () => options.structure?.() === 'locked';
  // Feature commands receive the facade; this is how they find the engine behind it.
  const engines = new Set<Editor>();
  const engineOf = (facade: IEditor) =>
    [...engines].find((engine) => facadeFor(engine as unknown as EngineHandle) === facade);

  const plugin = new Plugin({
    key: identityKey,
    filterTransaction(tr: EngineTransaction, state: EngineState) {
      if (!tr.docChanged || tr.getMeta(identityKey)) return true;
      const ids = required();
      if (ids.length > 0) {
        const before = idsOf(state.doc);
        const after = idsOf(tr.doc);
        if (ids.some((id) => before.has(id) && !after.has(id))) return false;
      }
      return !locked() || skeletonOf(state.doc) === skeletonOf(tr.doc);
    },
    appendTransaction(trs, oldState, newState) {
      if (!trs.some((tr) => tr.docChanged)) return null;
      const oldPositions = new Map<string, number>();
      for (const { node, pos } of blocksOf(oldState.doc)) {
        if (typeof node.attrs.key === 'string') oldPositions.set(node.attrs.key, pos);
      }
      const mapped = (pos: number) => trs.reduce((at, tr) => tr.mapping.map(at, 1), pos);
      const pasted = trs.some((tr) => tr.getMeta('uiEvent') === 'paste');

      const blocks = blocksOf(newState.doc);
      const taken = new Set<string>();
      const byKey = new Map<string, Block[]>();
      for (const block of blocks) {
        const key = block.node.attrs.key;
        if (typeof key !== 'string' || key === '') continue;
        taken.add(key);
        byKey.set(key, [...(byKey.get(key) ?? []), block]);
      }

      const tr = newState.tr;
      const renew = (block: Block, withId: boolean) => {
        tr.setNodeAttribute(block.pos, 'key', freshKey(taken));
        if (!withId) tr.setNodeAttribute(block.pos, 'id', null);
      };
      for (const block of blocks) {
        const key = block.node.attrs.key;
        if (typeof key !== 'string' || key === '') renew(block, true);
      }
      for (const [key, group] of byKey) {
        const old = oldPositions.get(key);
        // The block the old one's position maps to is the original; any other holder of its key is a copy.
        let keeper = old === undefined ? undefined : group.find((block) => block.pos === mapped(old));
        if (!keeper && !(pasted && old === undefined)) keeper = group[0];
        for (const block of group) if (block !== keeper) renew(block, false);
      }
      if (!tr.docChanged) return null;
      return tr.setMeta(identityKey, true);
    },
  });

  const engineExtension = Extension.create({
    name: 'blockIdentity',
    onBeforeCreate() {
      engines.add(this.editor);
    },
    onDestroy() {
      engines.delete(this.editor);
    },
    // Every email block node declares `id` and `key` itself; the core paragraph is the one that does not.
    addGlobalAttributes: () => [
      {
        types: ['paragraph'],
        attributes: {
          id: { default: null, rendered: false, keepOnSplit: false, parseHTML: () => null },
          key: { default: null, rendered: false, keepOnSplit: false, parseHTML: () => null },
        },
      },
    ],
    addProseMirrorPlugins: () => [plugin],
  });

  const deletable = (state: EngineState): Block | undefined => {
    const block = blockAt(state);
    if (!block || locked()) return undefined;
    const id = block.node.attrs.id;
    return typeof id === 'string' && required().includes(id) ? undefined : block;
  };

  return {
    id: 'blockIdentity',
    advanced: { engineExtensions: [engineExtension] },
    commands: {
      assignBlockIds: {
        args: z.object({ ids: z.record(z.string(), z.string()) }),
        run: (facade, { ids }: { ids: Record<string, string> }) => {
          const engine = engineOf(facade);
          if (!engine) return false;
          const tr = engine.state.tr;
          for (const { node, pos } of blocksOf(engine.state.doc)) {
            const key = node.attrs.key;
            if (typeof key === 'string' && key in ids && node.attrs.id !== ids[key]) {
              tr.setNodeAttribute(pos, 'id', ids[key]);
            }
          }
          // The host's ids are not an edit the author made, so undo must not take them back.
          engine.view.dispatch(tr.setMeta(identityKey, true).setMeta('addToHistory', false));
          return true;
        },
      },
      deleteBlock: {
        run: (facade) => {
          const engine = engineOf(facade);
          const block = engine && deletable(engine.state);
          if (!engine || !block) return false;
          const before = engine.state.doc;
          engine.view.dispatch(engine.state.tr.delete(block.pos, block.pos + block.node.nodeSize));
          return engine.state.doc !== before;
        },
        can: (facade) => {
          const engine = engineOf(facade);
          return engine !== undefined && deletable(engine.state) !== undefined;
        },
      },
    },
  };
}
