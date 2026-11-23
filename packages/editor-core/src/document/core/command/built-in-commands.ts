import type { Editor } from '@tiptap/core';
import { NodeSelection, type Transaction } from '@tiptap/pm/state';
import { z } from 'zod';
import { CONTENT_LOAD_META } from '../engine/content-load.js';
import type { EngineHandle } from '../engine/engine-handle.js';
import type { ResolvedCommand } from './command-registry.js';

/**
 * The engine-backed primitive commands every editor ships with. Feature commands
 * compose these through the facade (`editor.run('toggleMark', ...)`) instead of
 * touching the engine, which is what lets a feature author stay engine-free
 * while still mutating the document. The exported signature is engine-free (an
 * opaque `EngineHandle` in, a table of engine-free `ResolvedCommand`s out); the
 * real `Editor` is only used inside these closures.
 */

const attrs = z.record(z.string(), z.unknown()).optional();
const named = z.object({ name: z.string().min(1), attrs });
const content = z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown()))]);

/** Replace the document as a host load (the facade's `setContent`): marked so guards let it through,
 *  and kept out of undo so an undo right after a load cannot bring the previous document back. The
 *  `setContent` command stays unmarked: a feature running it acts for the author. */
export function loadContent(handle: EngineHandle, content: unknown): boolean {
  const editor = handle as unknown as Editor;
  return editor
    .chain()
    .command(({ tr }) => {
      tr.setMeta(CONTENT_LOAD_META, true).setMeta('addToHistory', false);
      return true;
    })
    .setContent(content as Parameters<Editor['commands']['setContent']>[0])
    .run();
}

type PmNode = Editor['state']['doc'];

/** Clears the `id` of every block in a copied block, so the copy is a new block the host has not named.
 *  An inline node keeps its `id`: on a mention or a token it names the target, not the node. */
function withoutIds(json: Record<string, unknown>, schema: Editor['schema']): Record<string, unknown> {
  const attrs = json.attrs as Record<string, unknown> | undefined;
  const content = json.content as Record<string, unknown>[] | undefined;
  const inline = schema.nodes[json.type as string]?.isInline ?? false;
  return {
    ...json,
    ...(attrs && 'id' in attrs && !inline ? { attrs: { ...attrs, id: null } } : {}),
    ...(content ? { content: content.map((child) => withoutIds(child, schema)) } : {}),
  };
}

/** The blocks that hold other blocks and only text in the end, which Turn into rewrites without losing anything. */
const TEXT_HOLDERS = new Set([
  'blockquote',
  'bulletList',
  'orderedList',
  'taskList',
  'listItem',
  'taskItem',
  'callout',
]);
const LIST_ITEMS = new Set(['listItem', 'taskItem']);

function holdsOnlyText(node: PmNode): boolean {
  if (node.isTextblock) return !node.type.spec.code;
  if (!TEXT_HOLDERS.has(node.type.name)) return false;
  let only = true;
  node.forEach((child) => {
    if (!holdsOnlyText(child)) only = false;
  });
  return only;
}

/**
 * The transaction that turns the selected block into `name`, or `null` when the selection is not a whole block
 * of text or the schema has no such type. A list item leaves its list: the list splits around it, and the item
 * becomes the target, so turning it into the list type it is already in changes nothing. The only item of a
 * list turns the whole list, which keeps the list's attributes, such as its id, on what replaces it.
 */
function turnInto(state: Editor['state'], name: string, a: Record<string, unknown>): Transaction | null {
  const { selection, schema } = state;
  if (!(selection instanceof NodeSelection)) return null;
  const $picked = state.doc.resolve(selection.from);
  const alone = LIST_ITEMS.has(selection.node.type.name) && $picked.parent.childCount === 1;
  const source = alone ? $picked.parent : selection.node;
  const from = alone ? $picked.before() : selection.from;
  const target = schema.nodes[name];
  if (!target || !holdsOnlyText(source)) return null;
  const lines: PmNode[] = [];
  if (source.isTextblock) lines.push(source);
  else source.descendants((node) => (node.isTextblock ? (lines.push(node), false) : true));
  if (lines.length === 0) return null;
  const paragraph = schema.nodes.paragraph;
  const item = schema.nodes[name === 'taskList' ? 'taskItem' : 'listItem'];
  // The first block built takes the attributes of the old one its type also declares, such as a host's
  // block id, so the block keeps who it is across the change; the rest are new blocks.
  const declared = target.spec.attrs ?? {};
  const kept = Object.fromEntries(Object.entries(source.attrs).filter(([key]) => key in declared));
  const firstAttrs = { ...kept, ...a };
  let built: PmNode[];
  if (name === 'paragraph' || name === 'heading') {
    built = lines.map((line, index) => target.create(index === 0 ? firstAttrs : a, line.content));
  } else if (name === 'blockquote') {
    built = [
      target.create(
        firstAttrs,
        lines.map((line) => paragraph.create(null, line.content)),
      ),
    ];
  } else if (item && target.contentMatch.matchType(item)) {
    built = [
      target.create(
        firstAttrs,
        lines.map((line) => item.create(null, paragraph.create(null, line.content))),
      ),
    ];
  } else {
    return null;
  }
  if (!LIST_ITEMS.has(source.type.name)) {
    const tr = state.tr.replaceWith(from, from + source.nodeSize, built);
    return tr.setSelection(NodeSelection.create(tr.doc, from));
  }
  const list = $picked.parent;
  if (list.type === target) return state.tr;
  const listStart = $picked.before();
  const offset = selection.from - listStart - 1;
  const before = offset > 0 ? list.copy(list.content.cut(0, offset)) : null;
  const rest = list.content.cut(offset + source.nodeSize);
  const after = rest.size > 0 ? list.copy(rest) : null;
  const pieces = [before, ...built, after].filter((piece): piece is PmNode => piece !== null);
  const tr = state.tr.replaceWith(listStart, listStart + list.nodeSize, pieces);
  return tr.setSelection(NodeSelection.create(tr.doc, listStart + (before?.nodeSize ?? 0)));
}

/** The elements `tiptap-extension-global-drag-handle` puts its handle beside, besides a top-level block. */
const DRAG_HANDLE_TARGETS = 'li, p:not(:first-child), pre, blockquote, h1, h2, h3, h4, h5, h6';

/**
 * The position of the node nested in a top-level block that a drag from the handle beside the point moves, or
 * `null` when that is a top-level block itself. It follows the handle's own lookup: the first element under the
 * point that is a block of the text or one of its targets, then the node at that element's first line, lifted to
 * the node holding it when deeper than a list item.
 */
function dragTargetAt(view: Editor['view'], x: number, y: number): number | null {
  const element = document
    .elementsFromPoint(x, y)
    .find((candidate) => candidate.parentElement === view.dom || candidate.matches(DRAG_HANDLE_TARGETS));
  if (!element || element.parentElement === view.dom || !view.dom.contains(element)) return null;
  const inside = view.posAtCoords({ left: x, top: element.getBoundingClientRect().top + 1 })?.inside;
  if (inside === undefined || inside < 0) return null;
  const $pos = view.state.doc.resolve(inside);
  if ($pos.depth === 0) return null;
  let pos = $pos.depth > 1 ? $pos.before($pos.depth) : inside;
  const node = view.state.doc.nodeAt(pos);
  if (node?.isInline || node?.type.name === 'tableRow') pos = view.state.doc.resolve(pos).before();
  return pos;
}

export function makeBuiltInCommands(handle: EngineHandle): Record<string, ResolvedCommand> {
  const editor = handle as unknown as Editor;
  const attrsOf = (a?: Record<string, unknown>) => (a ?? {}) as Record<string, unknown>;

  // Run/probe an engine chain command by name, guarded so it no-ops when the
  // extension that provides it (heading/list/blockquote/hr — contributed by a
  // feature) is not registered. Lets a feature's toolbar/slash command compose
  // structural engine commands through the façade without engine access.
  const runEngine = (name: string, arg?: unknown): boolean => {
    const chain = editor.chain().focus() as unknown as Record<string, (a?: unknown) => { run: () => boolean }>;
    const command = chain[name];
    return typeof command === 'function' ? command.call(chain, arg).run() : false;
  };
  const canEngine = (name: string, arg?: unknown): boolean => {
    const probe = editor.can() as unknown as Record<string, (a?: unknown) => boolean>;
    const command = probe[name];
    return typeof command === 'function' ? Boolean(command.call(probe, arg)) : false;
  };

  return {
    insertContent: {
      args: z.object({ content }),
      run: ({ content: c }) => editor.chain().focus().insertContent(c).run(),
    },
    setContent: {
      args: z.object({ content }),
      run: ({ content: c }) => editor.commands.setContent(c),
    },
    toggleMark: {
      args: named,
      run: ({ name, attrs: a }) => editor.chain().focus().toggleMark(name, attrsOf(a)).run(),
      can: ({ name, attrs: a }) => editor.can().toggleMark(name, attrsOf(a)),
    },
    setMark: {
      args: named,
      run: ({ name, attrs: a }) => editor.chain().focus().setMark(name, attrsOf(a)).run(),
    },
    unsetMark: {
      args: z.object({ name: z.string().min(1) }),
      run: ({ name }) => editor.chain().focus().unsetMark(name).run(),
    },
    setNode: {
      args: named,
      run: ({ name, attrs: a }) => editor.chain().focus().setNode(name, attrsOf(a)).run(),
      can: ({ name, attrs: a }) => editor.can().setNode(name, attrsOf(a)),
    },
    toggleNode: {
      args: z.object({
        name: z.string().min(1),
        toggleTo: z.string().min(1).default('paragraph'),
        attrs,
      }),
      run: ({ name, toggleTo, attrs: a }) => editor.chain().focus().toggleNode(name, toggleTo, attrsOf(a)).run(),
    },
    updateAttributes: {
      args: z.object({
        name: z.string().min(1),
        attrs: z.record(z.string(), z.unknown()),
      }),
      run: ({ name, attrs: a }) => editor.chain().updateAttributes(name, a).run(),
    },
    setParagraph: {
      run: () => editor.chain().focus().setNode('paragraph').run(),
    },
    clearNodes: {
      run: () => editor.chain().focus().clearNodes().run(),
    },
    deleteSelection: {
      run: () => editor.chain().deleteSelection().run(),
    },
    // Delete an explicit document range — used by the inline slash menu to erase
    // the typed `/query` before running the chosen block command.
    deleteRange: {
      args: z.object({
        from: z.number().int().min(0),
        to: z.number().int().min(0),
      }),
      run: ({ from, to }) => editor.chain().focus().deleteRange({ from, to }).run(),
    },
    // The block "+" affordance: insert an empty paragraph after the top-level
    // block at viewport `y` (the block the drag handle points at), move the
    // caret into it, and type `/` so the inline slash menu opens on the fresh
    // line — the Notion "+" behavior. `y` maps to a block via its DOM rect
    // rather than `posAtCoords`, whose `x` would fall in the handle gutter.
    insertBlockAt: {
      args: z.object({ y: z.number() }),
      run: ({ y }) => {
        try {
          const { view } = editor;
          const blocks = Array.from(view.dom.children) as HTMLElement[];
          const target =
            blocks.find((element) => {
              const rect = element.getBoundingClientRect();
              return y >= rect.top && y <= rect.bottom;
            }) ?? blocks.at(-1);
          if (!target) return false;
          const after = view.state.doc.resolve(view.posAtDOM(target, 0)).after(1);
          return editor
            .chain()
            .insertContentAt(after, { type: 'paragraph' })
            .setTextSelection(after + 1)
            .insertContent('/')
            .scrollIntoView()
            .focus()
            .run();
        } catch {
          return false;
        }
      },
    },
    // Select, as a whole, the block the grip's menu acts on. Rects come from the DOM for the reason
    // `insertBlockAt` gives. With `x`, a point in the text right of the grip, a node the drag handle
    // addresses on its own inside another (a list item, a quote's later paragraph) is the one selected,
    // resolved as the handle resolves the node it drags, so the menu acts on what a drag would move.
    // Otherwise, and for a top-level block, it is the top-level block or the lane block under `y`.
    selectBlockAt: {
      args: z.object({ y: z.number(), x: z.number().optional() }),
      run: ({ y, x }) => {
        try {
          const { view } = editor;
          const select = (pos: number) => {
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
            return true;
          };
          const nested = x === undefined ? null : dragTargetAt(view, x, y);
          if (nested !== null) return select(nested);
          const under = (parent: PmNode, start: number): number | null => {
            let found: number | null = null;
            parent.forEach((child, offset) => {
              const pos = start + offset;
              const dom = view.nodeDOM(pos);
              if (found !== null || !(dom instanceof HTMLElement)) return;
              const rect = dom.getBoundingClientRect();
              if (y < rect.top || y > rect.bottom) return;
              found = pos;
              child.forEach((lane, laneOffset) => {
                if (!lane.type.spec.container) return;
                const inside = under(lane, pos + 1 + laneOffset + 1);
                if (inside !== null) found = inside;
              });
            });
            return found;
          };
          const pos = under(view.state.doc, 0);
          return pos === null ? false : select(pos);
        } catch {
          return false;
        }
      },
    },
    duplicateBlock: {
      run: () => {
        const { selection } = editor.state;
        if (!(selection instanceof NodeSelection)) return false;
        const copy = withoutIds(selection.node.toJSON() as Record<string, unknown>, editor.schema);
        return editor.chain().insertContentAt(selection.to, copy).run();
      },
    },
    // Replace the selected block with another type, keeping its text: a list or a quote becomes the
    // target with its items' text, where a toggle command would nest the target inside it. `can` says
    // whether the selected block is one that holds only text, so a menu offers it nowhere else.
    turnBlockInto: {
      args: z.object({ name: z.string().min(1), attrs }),
      run: ({ name, attrs: a }) => {
        const tr = turnInto(editor.state, name, attrsOf(a));
        if (!tr) return false;
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },
      can: ({ name, attrs: a }) => turnInto(editor.state, name, attrsOf(a)) !== null,
    },
    deleteBlock: {
      run: () => {
        if (!(editor.state.selection instanceof NodeSelection)) return false;
        return editor.chain().deleteSelection().run();
      },
    },
    deleteNode: {
      args: z.object({ name: z.string().min(1) }),
      run: ({ name }) => editor.chain().deleteNode(name).run(),
    },
    selectAll: {
      run: () => editor.chain().selectAll().run(),
    },
    focus: {
      run: (a) => {
        const position = (a as { position?: 'start' | 'end' | 'all' | number } | undefined)?.position;
        return editor.chain().focus(position).run();
      },
    },
    blur: {
      run: () => editor.chain().blur().run(),
    },

    // Structural block commands (guarded — see runEngine).
    toggleHeading: {
      args: z.object({ level: z.number().int().min(1).max(6) }),
      run: ({ level }) => runEngine('toggleHeading', { level }),
      can: ({ level }) => canEngine('toggleHeading', { level }),
    },
    toggleBulletList: { run: () => runEngine('toggleBulletList') },
    toggleOrderedList: { run: () => runEngine('toggleOrderedList') },
    toggleTaskList: { run: () => runEngine('toggleTaskList') },
    toggleBlockquote: { run: () => runEngine('toggleBlockquote') },
    setHorizontalRule: { run: () => runEngine('setHorizontalRule') },
  };
}
