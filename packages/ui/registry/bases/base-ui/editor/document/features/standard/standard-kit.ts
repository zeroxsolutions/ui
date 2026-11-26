import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import { Extension } from '@zeroxsolutions/editor-core/document/advanced';
import { defineFeature, type EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockLayout, type BlockLayoutOptions } from '@zeroxsolutions/editor-core/profiles/editor/index';
import { standardMarkCodecs, standardNodeCodecs } from './standard-codecs';
import { layoutWordsOf, type LayoutWords } from '../../layout/layout-words';
import { standardBlockMenu, standardSlashItems, standardToolbarItems, textStyleBubbleItems } from './standard-ui';
import { TaskItemView } from './task-item-view';

/** The width the drag handle is given. The handle looks this much plus 50px right of the pointer for the node it
 *  drags, and the grip's menu reads it back from the engine to look at the same point. */
const DRAG_HANDLE_WIDTH_PX = 24;

/**
 * Opens a document that ends on a block other than a paragraph with the empty line the trailing node keeps below it,
 * as JSON, before the editor is built. The trailing node would add it on the first transaction, which is the focus
 * the first press on the editor dispatches: ProseMirror then sets the block's selection, built on the document before
 * the line, on the document after it, and throws. Content given as HTML takes the line on its first transaction.
 */
const OpeningTrailingLine = Extension.create({
  name: 'openingTrailingLine',
  onBeforeCreate() {
    const content = this.editor.options.content as { type?: unknown; content?: { type?: unknown }[] } | null;
    if (typeof content !== 'object' || content === null || content.type !== 'doc') return;
    const blocks = Array.isArray(content.content) ? content.content : [];
    if (blocks.length === 0 || blocks.at(-1)?.type === 'paragraph') return;
    this.editor.options.content = { ...content, content: [...blocks, { type: 'paragraph' }] } as never;
  },
});

/** Options for the standard block set. */
export interface StandardKitOptions {
  /**
   * Placeholder shown on the empty document / empty top-level blocks. Pass a
   * localized string; empty headings always show `Heading N`. Defaults to the
   * slash-command hint.
   */
  placeholder?: string;
  /** Show the left-gutter block drag handle (default `true`). */
  dragHandle?: boolean;
  /**
   * Keep an empty paragraph below a last block that is not one (default `true`). A profile whose export
   * stores every block turns it off, since the kept line would export as an empty block.
   */
  trailingNode?: boolean;
  /**
   * The block layout every block takes, its text and background colour marks and their commands
   * (`setBlockLayout`, `setTextAlign`, ...), as `blockLayout` declares them; `{}` when absent. The email kit passes
   * `{ email: true }`; `false` leaves the layout out, for a host that declares it itself.
   */
  layout?: BlockLayoutOptions | false;
  /**
   * The words of the paragraph styles in the block menu and the bubble's text styling, over the English; a getter
   * is read once, as the kit is built.
   */
  messages?: Partial<LayoutWords> | (() => LayoutWords);
}

/**
 * The standard block set (L1–L2): headings, bullet/ordered/task lists,
 * blockquote, divider, hard break, plus the bold/italic/strike/code/underline/
 * highlight/sub/superscript marks — with undo-redo, drop/gap cursors, and their
 * input rules + shortcuts. Their engine schema comes from Tiptap's MIT
 * extensions (used **internally** — the feature exposes only an engine-free
 * `EditorFeature`); this file adds their codecs and slash/toolbar UI.
 *
 * `document`/`paragraph`/`text` are disabled (the compiler provides that
 * substrate); `codeBlock` and `link` are disabled (the dedicated code-block and
 * link features own those).
 */
export function standardKit(options: StandardKitOptions = {}): EditorFeature {
  const { placeholder = "Type '/' for commands...", dragHandle = true, trailingNode = true, layout = {} } = options;
  const layoutFeature = layout === false ? null : blockLayout(layout);
  const words = layoutWordsOf(options.messages);
  return defineFeature({
    id: 'standard',
    ...(layoutFeature ? { commands: layoutFeature.commands } : {}),
    codecs: standardNodeCodecs,
    markCodecs: standardMarkCodecs,
    slash: standardSlashItems,
    toolbar: standardToolbarItems,
    bubble: [...standardToolbarItems, ...textStyleBubbleItems(words)],
    blockMenu: standardBlockMenu(words),
    advanced: {
      engineExtensions: [
        StarterKit.configure({
          document: false,
          paragraph: false,
          text: false,
          codeBlock: false,
          link: false,
          ...(trailingNode ? {} : { trailingNode: false as const }),
        }),
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
        TaskList,
        // A React node view so the checkbox is the house `Checkbox`, not a bare
        // `<input>`. Cast at the seam: the view's props are typed locally to keep
        // the engine out of its `.d.ts` (see `task-item-view.tsx`).
        TaskItem.extend({
          addNodeView() {
            return ReactNodeViewRenderer(TaskItemView as never);
          },
        }).configure({ nested: true }),
        Placeholder.configure({
          includeChildren: true,
          placeholder: ({ node }) =>
            node.type.name === 'heading' ? `Heading ${node.attrs.level as number}` : placeholder,
        }),
        ...(dragHandle ? [GlobalDragHandle.configure({ dragHandleWidth: DRAG_HANDLE_WIDTH_PX })] : []),
        ...(trailingNode ? [OpeningTrailingLine] : []),
        ...(layoutFeature?.advanced?.engineExtensions ?? []),
      ],
    },
  });
}
