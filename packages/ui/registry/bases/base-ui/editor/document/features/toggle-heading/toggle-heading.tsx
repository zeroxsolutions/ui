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
import { CHROME_ICON_CLASS, ChromeIcon, useChromeActive } from '../../ui/chrome-icon';

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
        <span className="cn-button cn-button-variant-ghost cn-button-size-icon-sm text-muted-foreground flex size-6 shrink-0 cursor-pointer items-center justify-center select-none">
          <ChromeIcon
            icon={ChevronRightIcon}
            active={marker.active}
            className={cn(CHROME_ICON_CLASS, 'transition-transform', attrs.open && 'rotate-90')}
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

/** The heading a toggle heading folds under, at a level of 1 to 3. */
function levelOf(heading: NodeJSON | undefined): number {
  const level = Number(heading?.attrs?.level);
  return level >= 1 && level <= 6 ? level : 2;
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
    const summary = `<summary><h${level}>${escaped(heading === undefined ? '' : textOf(heading))}</h${level}></summary>`;
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
      <details data-slot="toggle-heading" className="group mt-6 mb-2" open={node.attrs?.open ?? true}>
        <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className="cn-button cn-button-variant-ghost cn-button-size-icon-sm text-muted-foreground flex size-6 shrink-0 cursor-pointer items-center justify-center select-none"
          >
            <span className="inline-block leading-none transition-transform group-open:rotate-90">&#9656;</span>
          </span>
          {heading !== undefined &&
            createElement(`h${level}`, { className: 'my-0 min-w-0 flex-1' }, ctx.renderChildren(heading))}
        </summary>
        <div className="pl-7">{ctx.renderChildren({ ...node, content: rest })}</div>
      </details>
    );
  },
  // Markdown keeps the block as raw HTML, which only the HTML import reads back.
  fromMarkdown: () => null,
  fromHTML: (element, ctx) => {
    if (element.tagName !== 'DETAILS' || !element.hasAttribute('data-toggle-heading')) return null;
    const summary = [...element.children].find((child) => child.tagName === 'SUMMARY') as HTMLElement | undefined;
    const read = summary === undefined ? [] : ctx.fromHTMLChildren(summary);
    const heading = read.find((child) => child.type === 'heading') ?? {
      type: 'heading',
      attrs: { level: 2 },
      content: summary?.textContent ? [{ type: 'text', text: summary.textContent }] : [],
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
