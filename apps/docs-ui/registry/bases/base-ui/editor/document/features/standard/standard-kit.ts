import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import { defineFeature, type EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { TaskItemView } from './task-item-view.js';

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
}
import { standardMarkCodecs, standardNodeCodecs } from './standard-codecs.js';
import {
  standardBubbleItems,
  standardSlashItems,
  standardToolbarItems,
} from './standard-ui.js';

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
  const { placeholder = "Type '/' for commands…", dragHandle = true } = options;
  return defineFeature({
    id: 'standard',
    codecs: standardNodeCodecs,
    markCodecs: standardMarkCodecs,
    slash: standardSlashItems,
    toolbar: standardToolbarItems,
    bubble: standardBubbleItems,
    advanced: {
      engineExtensions: [
        StarterKit.configure({
          document: false,
          paragraph: false,
          text: false,
          codeBlock: false,
          link: false,
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
            node.type.name === 'heading'
              ? `Heading ${node.attrs.level as number}`
              : placeholder,
        }),
        ...(dragHandle ? [GlobalDragHandle.configure({ dragHandleWidth: 24 })] : []),
      ],
    },
  });
}
