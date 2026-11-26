import { createElement, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { ChevronRightIcon } from '@/registry/bases/base-ui/icons/lucide/chevron-right-icon';
import { Heading1Icon } from '@/registry/bases/base-ui/icons/lucide/heading-1-icon';
import { Heading2Icon } from '@/registry/bases/base-ui/icons/lucide/heading-2-icon';
import { Heading3Icon } from '@/registry/bases/base-ui/icons/lucide/heading-3-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
  type SerializeContext,
} from '@zeroxsolutions/editor-core/document/core/index';
import type { ReactNodeCodec } from '../../../react-types';
import { ChromeIcon, useChromeActive } from '../../ui/chrome-icon';

const toggleHeadingAttrs = z.object({ open: z.boolean().default(true) });
type ToggleHeadingAttrs = z.infer<typeof toggleHeadingAttrs>;

export interface ToggleHeadingOptions {
  /** The host's words for the disclosure button and the slash items. */
  words?: {
    readonly collapse?: string;
    readonly expand?: string;
    /** A slash item's title for `level`. Default: `Toggle heading <level>`. */
    title?(level: 1 | 2 | 3): string;
  };
}

interface ToggleHeadingWords {
  readonly collapse: string;
  readonly expand: string;
}

function ToggleHeadingView({
  attrs,
  updateAttrs,
  children,
  words,
}: NodeViewProps<ToggleHeadingAttrs> & { words: ToggleHeadingWords }): ReactNode {
  const marker = useChromeActive();
  const root = useRef<HTMLDivElement>(null);
  // The marker sits beside the heading, centred on it; the heading's height is the browser's to know.
  const [headingHeight, setHeadingHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const heading = root.current?.querySelector(
      ':scope > div > [data-node-view-content] > [data-node-view-content-react] > :first-child',
    );
    if (!heading) return;
    const observer = new ResizeObserver(() => setHeadingHeight(heading.getBoundingClientRect().height));
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={root}
      data-slot="toggle-heading"
      data-open={attrs.open}
      className={cn(
        // The blocks sit in the content slot `NodeViewContent` renders, then in the engine's own element. The
        // heading's box starts at the block's edge, its text past the marker, so the drag handle the editor puts
        // beside a heading stands in the gutter rather than over the marker.
        'relative mt-6 mb-2 [&>div>[data-node-view-content]>[data-node-view-content-react]>:first-child]:my-0 [&>div>[data-node-view-content]>[data-node-view-content-react]>:first-child]:pl-7 [&>div>[data-node-view-content]>[data-node-view-content-react]>:not(:first-child)]:ml-7',
        !attrs.open && '[&>div>[data-node-view-content]>[data-node-view-content-react]>:not(:first-child)]:hidden',
      )}
    >
      <span
        role="button"
        aria-label={attrs.open ? words.collapse : words.expand}
        aria-expanded={attrs.open}
        contentEditable={false}
        {...marker.handlers}
        onClick={() => updateAttrs({ open: !attrs.open })}
        className="absolute top-0 left-0 flex items-center"
        style={headingHeight === null ? undefined : { height: headingHeight }}
      >
        <span className="cn-button cn-button-variant-ghost cn-button-size-icon-xs cn-editor-control-muted flex shrink-0 cursor-pointer items-center justify-center select-none">
          <ChromeIcon
            icon={ChevronRightIcon}
            active={marker.active}
            sized="menu"
            className={cn('transition-transform', attrs.open && 'rotate-90')}
          />
        </span>
      </span>
      <div>{children as ReactNode}</div>
    </div>
  );
}

const ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escaped = (text: string): string => text.replace(/[&<>"]/g, (character) => ESCAPES[character]);

function textOf(node: NodeJSON): string {
  return node.type === 'text' ? (node.text ?? '') : (node.content ?? []).map(textOf).join('');
}

/** The level `heading` is drawn at, read as the heading codec reads it, so a table of contents finds it there. */
function levelOf(heading: NodeJSON | undefined): number {
  return Math.min(6, Math.max(1, Number(heading?.attrs?.level) || 1));
}

const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** `text` with its character references decoded: the named ones an export writes, and numeric ones. */
function decoded(text: string): string {
  return text.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
    (reference, decimal?: string, hex?: string, name?: string) => {
      if (name !== undefined) return ENTITIES[name.toLowerCase()] ?? reference;
      const code = decimal !== undefined ? Number(decimal) : parseInt(hex ?? '', 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : reference;
    },
  );
}

/**
 * The toggle heading a Markdown export's opening reads as, or null for any other HTML: one holding more than the
 * opening is someone else's, which the import reports as dropped rather than losing what it holds.
 */
function headingOfMarkdown(html: string): NodeJSON<ToggleHeadingAttrs> | null {
  const match = /^<details data-toggle-heading( open)?>\s*<summary><h([1-6])>([^<]*)<\/h\2><\/summary>\s*$/.exec(html);
  if (match === null) return null;
  const text = decoded(match[3]);
  return {
    type: 'toggleHeading',
    attrs: { open: match[1] !== undefined },
    content: [
      { type: 'heading', attrs: { level: Number(match[2]) }, content: text === '' ? [] : [{ type: 'text', text }] },
    ],
  };
}

/**
 * The Viewer's toggle heading: a details element whose summary is the marker and the heading, opened and closed
 * by the browser with no script. Its children are the heading, then the blocks it folds.
 */
function ToggleHeadingDetails({ open, children }: { open: boolean; children: [ReactNode, ReactNode] }): ReactNode {
  const marker = useChromeActive();
  const [heading, rest] = children;
  return (
    <details data-slot="toggle-heading" className="group mt-6 mb-2" open={open}>
      <summary
        {...marker.handlers}
        className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden"
      >
        <span className="cn-button cn-button-variant-ghost cn-button-size-icon-xs cn-editor-control-muted flex shrink-0 items-center justify-center select-none">
          <ChromeIcon
            icon={ChevronRightIcon}
            active={marker.active}
            sized="menu"
            className="transition-transform group-open:rotate-90"
          />
        </span>
        {heading}
      </summary>
      <div className="pl-7 [&>:first-child]:mt-0!">{rest}</div>
    </details>
  );
}

const toggleHeadingCodec: ReactNodeCodec<ToggleHeadingAttrs> = {
  node: 'toggleHeading',
  toHTML: (node, ctx) => {
    const [heading, ...rest] = node.content ?? [];
    const summary = heading === undefined ? '' : ctx.serializeNode(heading);
    return `<details data-toggle-heading${node.attrs?.open === false ? '' : ' open'}><summary>${summary}</summary>${rest
      .map((child) => ctx.serializeNode(child))
      .join('')}</details>`;
  },
  // A summary holds no Markdown, so the heading is its text in an HTML heading; the rest stays Markdown.
  toMarkdown: (node, ctx: SerializeContext) => {
    const [heading, ...rest] = node.content ?? [];
    const level = levelOf(heading);
    // On one line, since a blank line would end the HTML block the opening is.
    const text = heading === undefined ? '' : textOf(heading).replace(/\s+/g, ' ').trim();
    const summary = `<summary><h${level}>${escaped(text)}</h${level}></summary>`;
    return [
      `<details data-toggle-heading${node.attrs?.open === false ? '' : ' open'}>`,
      summary,
      '',
      ...rest.map((child) => ctx.serializeNode(child)).flatMap((block) => [block, '']),
      '</details>',
    ].join('\n');
  },
  toReact: (node, ctx) => {
    const [heading, ...rest] = node.content ?? [];
    const level = levelOf(heading);
    return (
      <ToggleHeadingDetails open={node.attrs?.open ?? true}>
        {heading !== undefined &&
          createElement(`h${level}`, { className: 'mt-0! mb-0! min-w-0 flex-1' }, ctx.renderChildren(heading))}
        {ctx.renderChildren({ ...node, content: rest })}
      </ToggleHeadingDetails>
    );
  },
  // Markdown reads raw HTML a block at a time, so the blocks the export wrote inside come back after the heading.
  fromMarkdown: (token) =>
    token.type === 'html' && typeof token.value === 'string' ? headingOfMarkdown(token.value) : null,
  fromHTML: (element, ctx) => {
    if (element.tagName !== 'DETAILS' || !element.hasAttribute('data-toggle-heading')) return null;
    const summary = [...element.children].find((child) => child.tagName === 'SUMMARY') as HTMLElement | undefined;
    const read = summary === undefined ? [] : ctx.fromHTMLChildren(summary);
    const found = read.find((child) => child.type === 'heading');
    const text = summary?.textContent?.trim() ?? '';
    // A summary holding more than its heading keeps all its text, at the heading's level.
    const heading =
      found !== undefined && read.length === 1
        ? found
        : {
            type: 'heading',
            attrs: { level: levelOf(found ?? { type: 'heading', attrs: { level: 2 } }) },
            content: text === '' ? [] : [{ type: 'text', text: text.replace(/\s+/g, ' ') }],
          };
    const body = element.cloneNode(true) as HTMLElement;
    [...body.children].filter((child) => child.tagName === 'SUMMARY').forEach((child) => child.remove());
    return {
      type: 'toggleHeading',
      attrs: { open: element.hasAttribute('open') },
      content: [heading, ...ctx.fromHTMLChildren(body)],
    };
  },
};

const ICONS = { 1: Heading1Icon, 2: Heading2Icon, 3: Heading3Icon } as const;

/**
 * The toggle heading: a heading of level 1 to 3 that folds the blocks under it, the table of contents listing
 * it as a heading. HTML keeps it as `<details data-toggle-heading>` with the heading in its summary, which
 * Markdown writes as raw HTML.
 */
export function toggleHeading(options: ToggleHeadingOptions = {}): EditorFeature {
  const title = options.words?.title ?? ((level: number) => `Toggle heading ${level}`);
  const words: ToggleHeadingWords = {
    collapse: options.words?.collapse ?? 'Collapse',
    expand: options.words?.expand ?? 'Expand',
  };
  const render = (props: NodeViewProps<ToggleHeadingAttrs>): ReactNode => (
    <ToggleHeadingView {...props} words={words} />
  );
  return defineFeature({
    id: 'toggleHeading',
    nodes: [
      {
        name: 'toggleHeading',
        group: 'block',
        content: 'heading block*',
        defining: true,
        draggable: true,
        attrs: toggleHeadingAttrs,
        render,
      },
    ],
    codecs: [toggleHeadingCodec as NodeCodec],
    commands: {
      insertToggleHeading: {
        args: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2) }).optional(),
        run: (editor, args?: { level: 1 | 2 | 3 }) =>
          editor.run('insertContent', {
            content: {
              type: 'toggleHeading',
              attrs: { open: true },
              content: [{ type: 'heading', attrs: { level: args?.level ?? 2 } }],
            },
          }),
      },
    },
    slash: ([1, 2, 3] as const).map((level) => ({
      id: `toggle-heading-${level}`,
      icon: ICONS[level],
      title: title(level),
      description: 'A heading that folds what follows',
      group: 'Blocks',
      keywords: ['toggle', 'heading', 'collapse', 'fold', `h${level}`],
      command: 'insertToggleHeading',
      args: { level },
    })),
  });
}
