import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { z } from 'zod';
import { CONTENT_LOAD_META } from '../engine/content-load.js';
import type { EngineHandle } from '../engine/engine-handle.js';
import type { ResolvedCommand } from './command-registry.js';

/**
 * The engine-backed primitive commands every editor ships with. Feature commands
 * compose these through the façade (`editor.run('toggleMark', …)`) instead of
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

/** Clears every `id` in a copied block, so the copy is a new block the host has not named. */
function withoutIds(json: Record<string, unknown>): Record<string, unknown> {
  const attrs = json.attrs as Record<string, unknown> | undefined;
  const content = json.content as Record<string, unknown>[] | undefined;
  return {
    ...json,
    ...(attrs && 'id' in attrs ? { attrs: { ...attrs, id: null } } : {}),
    ...(content ? { content: content.map(withoutIds) } : {}),
  };
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
    // Select, as a whole, the top-level block or the lane block under viewport `y`: what the grip's
    // menu acts on. Rects come from the DOM for the reason `insertBlockAt` gives.
    selectBlockAt: {
      args: z.object({ y: z.number() }),
      run: ({ y }) => {
        try {
          const { view } = editor;
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
          if (pos === null) return false;
          view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
          return true;
        } catch {
          return false;
        }
      },
    },
    duplicateBlock: {
      run: () => {
        const { selection } = editor.state;
        if (!(selection instanceof NodeSelection)) return false;
        const copy = withoutIds(selection.node.toJSON() as Record<string, unknown>);
        return editor.chain().insertContentAt(selection.to, copy).run();
      },
    },
    // Replace the selected block with another type, keeping its text: a list or a quote becomes the
    // target with its items' text, where a toggle command would nest the target inside it.
    turnBlockInto: {
      args: z.object({ name: z.string().min(1), attrs }),
      run: ({ name, attrs: a }) => {
        const { state } = editor;
        const { selection, schema } = state;
        if (!(selection instanceof NodeSelection)) return false;
        const target = schema.nodes[name];
        if (!target) return false;
        const lines: PmNode[] = [];
        if (selection.node.isTextblock) lines.push(selection.node);
        else selection.node.descendants((node) => (node.isTextblock ? (lines.push(node), false) : true));
        if (lines.length === 0) return false;
        const paragraph = schema.nodes.paragraph;
        const item = schema.nodes[name === 'taskList' ? 'taskItem' : 'listItem'];
        // The first block built takes the attributes of the old one its type also declares, such as a host's
        // block id, so the block keeps who it is across the change; the rest are new blocks.
        const declared = target.spec.attrs ?? {};
        const kept = Object.fromEntries(Object.entries(selection.node.attrs).filter(([key]) => key in declared));
        const firstAttrs = { ...kept, ...attrsOf(a) };
        let built: PmNode[];
        if (name === 'paragraph' || name === 'heading') {
          built = lines.map((line, index) => target.create(index === 0 ? firstAttrs : attrsOf(a), line.content));
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
          return false;
        }
        const tr = state.tr.replaceWith(selection.from, selection.to, built);
        tr.setSelection(NodeSelection.create(tr.doc, selection.from));
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },
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
