import { Placeholder } from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { defineFeature, type EditorFeature } from '../document/core/index.js';

/**
 * The composer's base kit — the minimal engine set for a compact, single-line
 * chat input. It reuses the document engine (via the shared `createEditor`
 * builder) but strips every block and mark: the surface is plain text plus
 * inline `@` mention atoms (the `mention()` feature is composed alongside), never
 * a rich document. Undo/redo and a hard break (for `Shift+Enter`) are kept; a
 * placeholder is shown when empty.
 *
 * The single-textblock constraint is **structural** — the builder is driven with
 * `.topContent(COMPOSER_TOP_CONTENT)`, so the schema admits exactly one
 * paragraph and `Enter`/`splitBlock` can never create a second block. `Enter →
 * submit` is therefore owned by the React input (a capture-phase handler,
 * mirroring the slash menu), not a keymap here.
 */

/** The top-node content expression that makes the composer a single textblock. */
export const COMPOSER_TOP_CONTENT = 'paragraph';

export interface ComposerKitOptions {
  /** Placeholder shown when the composer is empty. */
  placeholder?: string;
}

export function composerKit(options: ComposerKitOptions = {}): EditorFeature {
  const { placeholder = 'Message…' } = options;
  return defineFeature({
    id: 'composer',
    advanced: {
      engineExtensions: [
        // Keep only `hardBreak` (Shift+Enter newline), `undoRedo`, and the
        // cursors; disable every block node and every mark — a chat line is
        // plain text + mentions, and the payload model carries no marks, so
        // allowing them would silently drop formatting on submit.
        StarterKit.configure({
          document: false,
          paragraph: false,
          text: false,
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
          trailingNode: false,
          bold: false,
          italic: false,
          strike: false,
          code: false,
          underline: false,
          link: false,
        }),
        Placeholder.configure({ placeholder }),
      ],
    },
  });
}
