import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import { defineFeature, type EditorFeature } from '../../core/index.js';
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
export function standardKit(): EditorFeature {
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
        TaskItem.configure({ nested: true }),
      ],
    },
  });
}
