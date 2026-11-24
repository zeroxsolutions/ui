import { Link } from '@tiptap/extension-link';
import { LinkIcon } from '@/registry/bases/base-ui/icons/lucide/link-icon';
import { z } from 'zod';
import {
  defineFeature,
  type BubbleItem,
  type EditorFeature,
  type MarkCodec,
} from '@zeroxsolutions/editor-core/document/core/index';
import type { ReactMarkCodec } from '../../../react-types';

/**
 * The link mark. Its engine schema + autolink/paste-URL behavior come from
 * Tiptap's MIT `@tiptap/extension-link` (used **internally** — the feature
 * exposes only an engine-free `EditorFeature`; `standardKit` disables its own
 * `link` so this feature owns it). This file adds the Markdown/HTML/React codec,
 * the `setLink`/`unsetLink` commands (composed from built-in `setMark`/
 * `unsetMark`), and a bubble affordance the chrome fills via its link popover.
 */
/** The schemes a link may open; an address naming no scheme opens in the site and is kept too. */
const SCHEMES: ReadonlySet<string> = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * `href` where it opens a web, mail or phone address or one in the site, else null. The scheme is read as a
 * browser reads it, after dropping the control characters and spaces around the address and the tabs and newlines
 * inside it, so `java&#9;script:` is refused as `javascript:` is.
 */
export function linkHref(href: string): string | null {
  // eslint-disable-next-line no-control-regex -- the controls are what a browser drops from an address
  const read = href.replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '').replace(/[\t\n\r]/g, '');
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(read)?.[1];
  return scheme === undefined || SCHEMES.has(scheme.toLowerCase()) ? href : null;
}

const linkArgs = z.object({ href: z.string().min(1) });

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * `href` as a Markdown link destination: as it is where it holds nothing that ends one, else in angle brackets
 * with the brackets, line breaks and backslash it holds percent-encoded, so it cannot close the link and write
 * markup after it.
 */
function markdownDestination(href: string): string {
  if (!/[\s()<>\\]/.test(href)) return href;
  const encoded = href.replace(
    /[<>\\\r\n]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  );
  return `<${encoded}>`;
}

/** The address a stored link mark opens, or null for one `linkHref` refuses, which every export writes as text. */
const hrefOf = (attrs: Record<string, unknown> | undefined): string | null => linkHref(String(attrs?.href ?? ''));

const linkCodec: ReactMarkCodec = {
  mark: 'link',
  toMarkdown: (mark) => {
    const href = hrefOf(mark.attrs);
    return href === null ? { open: '', close: '' } : { open: '[', close: `](${markdownDestination(href)})` };
  },
  toHTML: (mark) => {
    const href = hrefOf(mark.attrs);
    return href === null ? { open: '', close: '' } : { open: `<a href="${escapeAttr(href)}">`, close: '</a>' };
  },
  toReact: (mark, children) => {
    const href = hrefOf(mark.attrs);
    return href === null ? (
      children
    ) : (
      <a href={href} rel="noreferrer">
        {children}
      </a>
    );
  },
  // A link the reader should not open is not read: its text stays, unmarked.
  fromMarkdown: (token) => {
    if (token.type !== 'link') return null;
    const href = linkHref(String(token.url ?? ''));
    return href === null ? null : { type: 'link', attrs: { href } };
  },
  fromHTML: (element) => {
    if (element.tagName !== 'A') return null;
    const href = linkHref(element.getAttribute('href') ?? '');
    return href === null ? null : { type: 'link', attrs: { href } };
  },
};

/** The chrome renders its own href popover, then calls `setLink`; the item just
 *  marks where the affordance lives and what active state it reflects. */
const linkBubbleItem: BubbleItem = {
  id: 'link',
  title: 'Link',
  icon: LinkIcon,
  command: 'setLink',
  activeWhen: 'link',
};

export function link(): EditorFeature {
  return defineFeature({
    id: 'link',
    markCodecs: [linkCodec as MarkCodec],
    commands: {
      setLink: {
        args: linkArgs,
        run: (editor, args) =>
          linkHref(args.href) !== null && editor.run('setMark', { name: 'link', attrs: { href: args.href } }),
        can: (editor, args) => linkHref(args.href) !== null && editor.can('setMark', { name: 'link', attrs: args }),
      },
      unsetLink: {
        run: (editor) => editor.run('unsetMark', { name: 'link' }),
      },
    },
    bubble: [linkBubbleItem],
    advanced: {
      engineExtensions: [
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          // A pasted or parsed link is kept by the rule the codec imports by.
          isAllowedUri: (url: string) => linkHref(url) !== null,
        }),
      ],
    },
  });
}
