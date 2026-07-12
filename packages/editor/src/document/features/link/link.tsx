import { Link } from '@tiptap/extension-link';
import { Link as LinkIcon } from 'lucide-react';
import { z } from 'zod';
import {
  defineFeature,
  type BubbleItem,
  type EditorFeature,
  type MarkCodec,
} from '../../core/index.js';

/**
 * The link mark. Its engine schema + autolink/paste-URL behavior come from
 * Tiptap's MIT `@tiptap/extension-link` (used **internally** — the feature
 * exposes only an engine-free `EditorFeature`; `standardKit` disables its own
 * `link` so this feature owns it). This file adds the Markdown/HTML/React codec,
 * the `setLink`/`unsetLink` commands (composed from built-in `setMark`/
 * `unsetMark`), and a bubble affordance the chrome fills via its link popover.
 */
const linkArgs = z.object({ href: z.string().min(1) });

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const linkCodec: MarkCodec = {
  mark: 'link',
  toMarkdown: (mark) => ({ open: '[', close: `](${String(mark.attrs?.href ?? '')})` }),
  toHTML: (mark) => ({
    open: `<a href="${escapeAttr(String(mark.attrs?.href ?? ''))}">`,
    close: '</a>',
  }),
  toReact: (mark, children) => (
    <a href={String(mark.attrs?.href ?? '')} rel="noreferrer">
      {children}
    </a>
  ),
  fromMarkdown: (token) =>
    token.type === 'link'
      ? { type: 'link', attrs: { href: String(token.url ?? '') } }
      : null,
  fromHTML: (element) =>
    element.tagName === 'A'
      ? { type: 'link', attrs: { href: element.getAttribute('href') ?? '' } }
      : null,
};

/** The chrome renders its own href popover, then calls `setLink`; the item just
 *  marks where the affordance lives and what active state it reflects. */
const linkBubbleItem: BubbleItem = {
  id: 'link',
  title: 'Link',
  icon: <LinkIcon className="size-4" />,
  command: 'setLink',
  activeWhen: 'link',
};

export function link(): EditorFeature {
  return defineFeature({
    id: 'link',
    markCodecs: [linkCodec],
    commands: {
      setLink: {
        args: linkArgs,
        run: (editor, args) =>
          editor.run('setMark', { name: 'link', attrs: { href: args.href } }),
      },
      unsetLink: {
        run: (editor) => editor.run('unsetMark', { name: 'link' }),
      },
    },
    bubble: [linkBubbleItem],
    advanced: {
      engineExtensions: [
        Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      ],
    },
  });
}
