import { z } from 'zod';
import { CONTENT_LOAD_META, Extension, Plugin, PluginKey, facadeFor } from '../../document/advanced.js';
import type { Editor, EngineHandle } from '../../document/advanced.js';
import type { EditorFeature, IEditor, NodeJSON } from '../../document/core/types/index.js';
import { EMAIL_BLOCK_NODES } from './email-nodes.js';

type EngineState = Editor['state'];
type EngineNode = EngineState['doc'];
type EngineTransaction = EngineState['tr'];
type EngineSchema = EngineState['schema'];

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
/**
 * Attributes the skeleton ignores: identity's own, the stored text an import keeps beside it, and a
 * button's label, which is text a translated locale changes; its `href` names a variable and stays.
 */
const UNSTRUCTURAL = new Set(['id', 'key', 'source', 'label']);
const identityKey = new PluginKey('blockIdentity');
/** Kept out of HTML both ways, so a copy never carries a host id or a key onto the clipboard. */
const identityAttribute = { default: null, rendered: false, keepOnSplit: false, parseHTML: () => null };

function carriesKey(node: EngineNode): boolean {
  const attrs = node.type.spec.attrs;
  return attrs !== undefined && 'key' in attrs;
}

function keyOf(node: EngineNode): string | undefined {
  const key = node.attrs.key;
  return typeof key === 'string' && key !== '' ? key : undefined;
}

function idOf(node: EngineNode): string | undefined {
  return typeof node.attrs.id === 'string' ? node.attrs.id : undefined;
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
    const id = idOf(node);
    if (id !== undefined) ids.add(id);
  }
  return ids;
}

/** Every id in a block's subtree, the block's own included: a columns block holds its lanes' blocks. */
function subtreeIds(node: EngineNode): string[] {
  const ids: string[] = [];
  const own = idOf(node);
  if (own !== undefined) ids.push(own);
  node.descendants((child) => {
    const id = idOf(child);
    if (id !== undefined) ids.push(id);
  });
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

/** The innermost block holding `from..to`. */
function blockHolding(blocks: Block[], from: number, to: number): Block | undefined {
  return blocks.filter((block) => block.pos < from && to < block.pos + block.node.nodeSize).at(-1);
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
  return blockHolding(all, selection.from, selection.to);
}

/** A key for every block of a document about to open, without a transaction: the opening is no edit. */
function keyOpeningContent(content: unknown, schema: EngineSchema): unknown {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) return content;
  const taken = new Set<string>();
  const keyed = (node: NodeJSON): NodeJSON => {
    const spec = schema.nodes[node.type]?.spec.attrs;
    const lanes = node.content?.map((child) =>
      child.type === LANE ? { ...child, content: child.content?.map(keyed) } : child,
    );
    const next = lanes ? { ...node, content: lanes } : { ...node };
    if (!spec || !('key' in spec)) return next;
    const key = next.attrs?.key;
    const fresh = typeof key === 'string' && key !== '' && !taken.has(key) ? key : undefined;
    if (fresh) taken.add(fresh);
    return { ...next, attrs: { ...next.attrs, key: fresh ?? freshKey(taken) } };
  };
  const doc = content as NodeJSON;
  return { ...doc, content: doc.content?.map(keyed) };
}

/**
 * Gives every block (top-level or directly in a lane) a `key` unique in the document and keeps the
 * host's `id` on it across edits and moves; a pasted, duplicated or split-off block gets `id: null`
 * and a fresh key. `required` blocks cannot be removed, and `structure: 'locked'` refuses any change
 * to the blocks themselves; a host's content load passes both. Adds `assignBlockIds({ ids })`
 * (key -> id) and `deleteBlock`.
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
      if (!tr.docChanged || tr.getMeta(identityKey) || tr.getMeta(CONTENT_LOAD_META)) return true;
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
      const mapped = (pos: number) => trs.reduce((at, tr) => tr.mapping.map(at, 1), pos);
      const pasted = trs.some((tr) => tr.getMeta('uiEvent') === 'paste');
      const blocks = blocksOf(newState.doc);
      const taken = new Set(blocks.map((block) => keyOf(block.node)).filter((key): key is string => !!key));
      const oldBlocks = blocksOf(oldState.doc);
      const oldKeys = new Set(oldBlocks.map((old) => keyOf(old.node)));

      // The block that now holds an old block's content start keeps its key and id. A split copies both
      // onto the two halves; this keeps them on the first half, or on the second when Enter came at the
      // very start of the block, since that half keeps the text.
      const keepers = new Map<string, Block>();
      for (const old of oldBlocks) {
        const key = keyOf(old.node);
        if (key === undefined || keepers.has(key)) continue;
        const start = mapped(old.node.isLeaf ? old.pos : old.pos + 1);
        const target = old.node.isLeaf
          ? blocks.find((block) => block.pos === start)
          : blockHolding(blocks, start, start);
        if (target && keyOf(target.node) === key) keepers.set(key, target);
      }

      const tr = newState.tr;
      const set = (block: Block, key: string, id: string | null) => {
        if (keyOf(block.node) !== key) tr.setNodeAttribute(block.pos, 'key', key);
        if ((block.node.attrs.id ?? null) !== id) tr.setNodeAttribute(block.pos, 'id', id);
      };
      const heldIds = new Set<string>();
      const firstHolder = new Map<string, Block>();
      for (const block of blocks) {
        const key = keyOf(block.node);
        if (key !== undefined && !firstHolder.has(key)) firstHolder.set(key, block);
      }
      const keptKey = (block: Block, key: string) => {
        const keeper = keepers.get(key);
        if (keeper) return keeper === block;
        // A key the old document did not place: its first holder keeps it, unless a paste brought it.
        return firstHolder.get(key) === block && !(pasted && !oldKeys.has(key));
      };

      // Blocks new to the document, keyed or not, are settled after the ones it already had, so a
      // newcomer keeps its id only when no block holds it and no paste brought it.
      const newcomers: Block[] = [];
      for (const block of blocks) {
        const key = keyOf(block.node);
        if (key === undefined || (keptKey(block, key) && !oldKeys.has(key))) {
          newcomers.push(block);
        } else if (keptKey(block, key)) {
          const id = idOf(block.node);
          if (id !== undefined) heldIds.add(id);
        } else {
          set(block, freshKey(taken), null);
        }
      }
      for (const block of newcomers) {
        const id = idOf(block.node);
        const keep = id !== undefined && !pasted && !heldIds.has(id);
        if (keep) heldIds.add(id);
        set(block, keyOf(block.node) ?? freshKey(taken), keep ? id : null);
      }
      if (!tr.docChanged) return null;
      return tr.setMeta(identityKey, true);
    },
  });

  const engineExtension = Extension.create({
    name: 'blockIdentity',
    onBeforeCreate() {
      engines.add(this.editor);
      this.editor.options.content = keyOpeningContent(this.editor.options.content, this.editor.schema) as never;
    },
    onDestroy() {
      engines.delete(this.editor);
    },
    addGlobalAttributes: () => [
      {
        types: ['paragraph', ...EMAIL_BLOCK_NODES],
        attributes: { id: identityAttribute, key: identityAttribute },
      },
    ],
    addProseMirrorPlugins: () => [plugin],
  });

  const deletable = (state: EngineState): Block | undefined => {
    const block = blockAt(state);
    if (!block || locked()) return undefined;
    const ids = required();
    return subtreeIds(block.node).some((id) => ids.includes(id)) ? undefined : block;
  };

  return {
    id: 'blockIdentity',
    advanced: { engineExtensions: [engineExtension] },
    commands: {
      /**
       * Sets each keyed block's host id. Refuses, changing nothing, when an id would end up on two
       * blocks; otherwise it skips the required and locked guards, because the ids come from the host.
       */
      assignBlockIds: {
        args: z.object({ ids: z.record(z.string(), z.string()) }),
        run: (facade, { ids }: { ids: Record<string, string> }) => {
          const engine = engineOf(facade);
          if (!engine) return false;
          const blocks = blocksOf(engine.state.doc);
          const finalIds = blocks.map(({ node }) => {
            const key = keyOf(node);
            return key !== undefined && key in ids ? ids[key] : idOf(node);
          });
          const assigned = new Set(Object.values(ids));
          const held = finalIds.filter((id) => id !== undefined && assigned.has(id));
          if (new Set(held).size !== held.length) return false;
          const tr = engine.state.tr;
          blocks.forEach(({ node, pos }, index) => {
            if (finalIds[index] !== idOf(node)) tr.setNodeAttribute(pos, 'id', finalIds[index]);
          });
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
