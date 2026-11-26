'use client';

import { useState, type ReactNode } from 'react';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { sectionNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import {
  SECTION_BACKGROUNDS,
  SECTION_WIDTHS,
  SPACES,
  type LayoutSpace,
  type SectionBackground,
  type SectionLayout,
  type SectionWidth,
} from '@zeroxsolutions/editor-core/template/layout/index';
import type { ReactNodeCodec } from '../../../react-types';
import { BlockToolbar } from '../../layout/block-toolbar';
import { layoutProps } from '../../layout/layout-props';
import { DEFAULT_LAYOUT_WORDS, layoutWordsOf, type LayoutWords } from '../../layout/layout-words';

export interface SectionOptions {
  /** The words its toolbar draws: some over the English, or a getter read on each draw. */
  messages?: Partial<LayoutWords> | (() => LayoutWords);
  /** The widths its toolbar offers, in order; every width when absent. The email editor offers content and wide. */
  widths?: readonly SectionWidth[];
}

interface SectionAttrs extends SectionLayout {
  spaceBefore?: LayoutSpace | null;
  spaceAfter?: LayoutSpace | null;
}

/** What a section draws as while it sets no value: no background, a medium padding, the content's width. */
const DEFAULTS = { background: 'none', padding: 'medium', width: 'content' } as const satisfies Required<SectionLayout>;

const tokenOf = <T extends string>(tokens: readonly T[], value: unknown): T | undefined =>
  tokens.find((token) => token === value);

/**
 * The section's tokens as its drawn element's `data-*` attributes, the same that its HTML carries; a value outside
 * its set is not drawn, and a value that is not set draws no attribute, so the sheet draws the default.
 */
function sectionDataAttributes(attrs: Record<string, unknown>): Record<string, string> {
  const background = tokenOf(SECTION_BACKGROUNDS, attrs.background);
  const padding = tokenOf(SPACES, attrs.padding);
  const width = tokenOf(SECTION_WIDTHS, attrs.width);
  const { 'data-space-before': spaceBefore, 'data-space-after': spaceAfter } = layoutProps({
    spaceBefore: attrs.spaceBefore,
    spaceAfter: attrs.spaceAfter,
  });
  return {
    ...(background ? { 'data-background': background } : {}),
    ...(padding ? { 'data-padding': padding } : {}),
    ...(width ? { 'data-width': width } : {}),
    ...(spaceBefore ? { 'data-space-before': spaceBefore } : {}),
    ...(spaceAfter ? { 'data-space-after': spaceAfter } : {}),
  };
}

/** The section's surface, the same in the editor's view and in the Viewer, so both draw one box. */
function SectionShell({
  attrs,
  children,
  ref,
}: {
  attrs: Record<string, unknown>;
  children: ReactNode;
  ref?: (element: HTMLElement | null) => void;
}) {
  return (
    <section ref={ref} data-slot="section" {...sectionDataAttributes(attrs)} className="cn-editor-block">
      {children}
    </section>
  );
}

/** Children wrapped as the engine wraps a view's content, which the rules in `styles.css` select. */
function SectionContent({ children }: { children: ReactNode }) {
  return (
    <div data-node-view-content="">
      <div data-node-view-content-react="">{children}</div>
    </div>
  );
}

/** A dot of a section's background, as the toolbar offers it; `none` is the empty ring, struck through. */
function SectionSwatch({ background }: { background: SectionBackground }) {
  return (
    <svg
      data-slot="section-swatch"
      data-background={background}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden
      className="cn-editor-icon"
    >
      <circle cx="8" cy="8" r="7.5" />
      {background === 'none' && <line x1="3.5" y1="12.5" x2="12.5" y2="3.5" />}
    </svg>
  );
}

interface SectionToolbarProps {
  editor: IEditor;
  pos: number | undefined;
  anchor: HTMLElement | null;
  attrs: SectionAttrs;
  widths: readonly SectionWidth[];
  words: LayoutWords;
}

/** A group of toggles picking one of `values`, each named from words; picking the default stores no value. */
function SectionToolbarGroup<T extends string>({
  label,
  values,
  value,
  fallback,
  nameOf,
  render,
  onChange,
  wrap = false,
}: {
  label: string;
  /** Lets the toggles run onto more rows where the toolbar is narrower than the group. */
  wrap?: boolean;
  values: readonly T[];
  value: T | undefined;
  fallback: T;
  nameOf(value: T): string;
  render?(value: T): ReactNode;
  onChange(value: T | null): void;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      className={wrap ? 'flex-wrap' : undefined}
      size="sm"
      value={[value ?? fallback]}
      // At the group's edge the arrow keys go on to the toolbar's next control.
      loopFocus={false}
      onValueChange={(picked) => {
        const [next] = picked as T[];
        if (next !== undefined) onChange(next === fallback ? null : next);
      }}
    >
      {values.map((option) =>
        render ? (
          <Tooltip key={option}>
            <TooltipTrigger
              render={
                <ToggleGroupItem value={option} aria-label={nameOf(option)}>
                  {render(option)}
                </ToggleGroupItem>
              }
            />
            <TooltipContent>{nameOf(option)}</TooltipContent>
          </Tooltip>
        ) : (
          <ToggleGroupItem key={option} value={option}>
            {nameOf(option)}
          </ToggleGroupItem>
        ),
      )}
    </ToggleGroup>
  );
}

/** The section's floating toolbar: its background's swatches, then its padding and its width, each row wrapping. */
function SectionToolbar({ editor, pos, anchor, attrs, widths, words }: SectionToolbarProps) {
  const set = (layout: Partial<Record<keyof SectionLayout, string | null>>) =>
    editor.run('setSectionLayout', { pos, layout });
  return (
    <BlockToolbar editor={editor} pos={pos} anchor={anchor} label={words.toolbar}>
      {/* At most the viewport's width less the toolbar's margin, so a phone's page never scrolls sideways. */}
      <div data-slot="section-toolbar" className="flex max-w-[calc(100vw-2rem)] flex-col items-start">
        <SectionToolbarGroup<SectionBackground>
          label={words.sectionBackground}
          values={SECTION_BACKGROUNDS}
          value={tokenOf(SECTION_BACKGROUNDS, attrs.background)}
          fallback={DEFAULTS.background}
          nameOf={(token) => (token === 'none' ? words.noBackground : words.colors[token])}
          render={(token) => <SectionSwatch background={token} />}
          wrap
          onChange={(background) => set({ background })}
        />
        <div className="flex flex-wrap items-center">
          <SectionToolbarGroup<LayoutSpace>
            label={words.sectionPadding}
            values={SPACES}
            value={tokenOf(SPACES, attrs.padding)}
            fallback={DEFAULTS.padding}
            nameOf={(space) => words.spaces[space]}
            onChange={(padding) => set({ padding })}
          />
          {widths.length > 1 && <Separator orientation="vertical" className="mx-0.5 h-5 data-vertical:self-center" />}
          {widths.length > 1 && (
            <SectionToolbarGroup<SectionWidth>
              label={words.sectionWidth}
              values={widths}
              value={tokenOf(widths, attrs.width)}
              fallback={DEFAULTS.width}
              nameOf={(width) => words.sectionWidths[width]}
              onChange={(width) => set({ width })}
            />
          )}
        </div>
      </div>
    </BlockToolbar>
  );
}

function sectionView(words: () => LayoutWords, widths: readonly SectionWidth[]) {
  return function SectionView({ attrs, children, editor, getPos }: NodeViewProps<SectionAttrs>) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    return (
      <SectionShell attrs={attrs as Record<string, unknown>} ref={setAnchor}>
        {children as ReactNode}
        <SectionToolbar editor={editor} pos={getPos()} anchor={anchor} attrs={attrs} widths={widths} words={words()} />
      </SectionShell>
    );
  };
}

/** `element`'s section tokens: each a `data-*` attribute holding one of its set; any other value is dropped. */
function sectionAttrsOf(element: HTMLElement): Record<string, string> {
  const read = <T extends string>(tokens: readonly T[], name: string) => tokenOf(tokens, element.getAttribute(name));
  const attrs: SectionAttrs = {
    background: read(SECTION_BACKGROUNDS, 'data-background'),
    padding: read(SPACES, 'data-padding'),
    width: read(SECTION_WIDTHS, 'data-width'),
    spaceBefore: read(SPACES, 'data-space-before'),
    spaceAfter: read(SPACES, 'data-space-after'),
  };
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value !== undefined));
}

/** The inline nodes HTML may hold loose in a section, which only a paragraph holds in a document. */
const INLINE = new Set(['text', 'hardBreak']);

/** `nodes` with each run of loose inline nodes in a paragraph of its own, so a section holds blocks only. */
function linesOf(nodes: readonly NodeJSON[]): NodeJSON[] {
  const lines: NodeJSON[] = [];
  let loose: NodeJSON[] | null = null;
  for (const node of nodes) {
    if (!INLINE.has(node.type)) {
      lines.push(node);
      loose = null;
    } else if (loose) loose.push(node);
    else {
      loose = [node];
      lines.push({ type: 'paragraph', content: loose });
    }
  }
  return lines;
}

const sectionCodec: ReactNodeCodec = {
  node: 'section',
  toHTML: (node, ctx) => {
    const attributes = Object.entries(sectionDataAttributes(node.attrs ?? {}))
      .map(([name, value]) => ` ${name}="${value}"`)
      .join('');
    return `<section data-section${attributes}>${ctx.serializeChildren(node)}</section>`;
  },
  // Markdown has no section: its blocks in order.
  toMarkdown: (node, ctx) =>
    (node.content ?? [])
      .map((child) => ctx.serializeNode(child))
      .filter((markdown) => markdown.trim() !== '')
      .join('\n\n'),
  toReact: (node, ctx) => (
    <SectionShell attrs={node.attrs ?? {}}>
      <SectionContent>{ctx.renderChildren(node)}</SectionContent>
    </SectionShell>
  ),
  fromHTML: (element, ctx) => {
    // A section in a section reads as the blocks it holds, as a section never holds one.
    if (!element.hasAttribute('data-section') || element.parentElement?.closest('[data-section]')) return null;
    const content = linesOf(ctx.fromHTMLChildren(element));
    return {
      type: 'section',
      attrs: sectionAttrsOf(element),
      content: content.length > 0 ? content : [{ type: 'paragraph' }],
    };
  },
  fromMarkdown: () => null,
};

/** Whether the selection sits where a section may not: in a section or in a lane. */
const holdsNoSection = (editor: IEditor): boolean => editor.isActive('section') || editor.isActive('column');

/**
 * A section: blocks set together on a background from the theme's tokens, inside a padding, at the content's width,
 * wider, or the editor's full width. It holds any block but a section, and sits in no lane. Its floating toolbar
 * sets its background, padding and width through `setSectionLayout`, which the standard kit's block layout
 * declares. HTML keeps it whole; Markdown, which has no section, writes its blocks in order.
 */
export function section(options: SectionOptions = {}): EditorFeature {
  const [sectionNode] = sectionNodeSpecs();
  const words = () => layoutWordsOf(options.messages);
  const widths = options.widths ?? SECTION_WIDTHS;
  return defineFeature({
    id: 'section',
    nodes: [{ ...sectionNode, render: sectionView(words, widths) }],
    codecs: [sectionCodec as NodeCodec],
    commands: {
      insertSection: {
        run: (editor) =>
          !holdsNoSection(editor) &&
          editor.run('insertContent', { content: { type: 'section', content: [{ type: 'paragraph' }] } }),
        can: (editor) => !holdsNoSection(editor),
      },
    },
    slash: [
      {
        id: 'section',
        icon: LayoutPanelTopIcon,
        title: DEFAULT_LAYOUT_WORDS.section,
        description: 'Blocks set together on a background',
        group: 'Blocks',
        keywords: ['section', 'background', 'band', 'layout'],
        command: 'insertSection',
      },
    ],
  });
}
