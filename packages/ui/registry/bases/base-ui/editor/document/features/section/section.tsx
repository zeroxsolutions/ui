'use client';

import { useState, type ReactNode } from 'react';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { Extension, Plugin } from '@zeroxsolutions/editor-core/document/advanced';
import { sectionNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import {
  SECTION_BACKGROUNDS,
  SECTION_WIDTHS,
  SPACES,
  type LayoutSpace,
  type SectionLayout,
  type SectionWidth,
} from '@zeroxsolutions/editor-core/template/layout/index';
import type { ReactNodeCodec } from '../../../react-types';
import { layoutProps } from '../../layout/layout-props';
import { layoutWordsOf, type LayoutWords } from '../../layout/layout-words';
import { SectionToolbar } from './section-toolbar';

export interface SectionOptions {
  /** The words its toolbar draws: some over the English, or a getter read on each draw. */
  messages?: Partial<LayoutWords> | (() => LayoutWords);
  /** The widths its toolbar offers, in order; every width when absent. The email editor offers content and wide. */
  widths?: readonly SectionWidth[];
  /**
   * Whether the section at `pos` may be laid out, as a host's block menu decides; false draws no toolbar on it. Every
   * section may when absent.
   */
  changeable?(editor: IEditor, pos: number): boolean;
}

interface SectionAttrs extends SectionLayout {
  spaceBefore?: LayoutSpace | null;
  spaceAfter?: LayoutSpace | null;
}

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

function sectionView(
  words: () => LayoutWords,
  widths: readonly SectionWidth[],
  changeable: SectionOptions['changeable'],
) {
  return function SectionView({ attrs, children, editor, getPos }: NodeViewProps<SectionAttrs>) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const pos = getPos();
    return (
      <SectionShell attrs={attrs as Record<string, unknown>} ref={setAnchor}>
        {children as ReactNode}
        {pos !== undefined && (changeable?.(editor, pos) ?? true) && (
          <SectionToolbar
            editor={editor}
            pos={pos}
            anchor={anchor}
            layout={{
              background: tokenOf(SECTION_BACKGROUNDS, attrs.background),
              padding: tokenOf(SPACES, attrs.padding),
              width: tokenOf(widths, attrs.width),
            }}
            widths={widths}
            words={words()}
          />
        )}
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

/** The HTML of the blocks that hold blocks, as their codecs read it: a section, a lane, a callout, a list, a cell. */
const BLOCK_HOLDERS = '[data-section], [data-column], [data-callout], li, td, th, blockquote, details';

/**
 * Pasted HTML with each `<section data-section>` an export wrote spelled as the node's own HTML, which is all the
 * editor's paste reads, so a copied export pastes back as the section it was, its tokens kept.
 */
function pastedSections(html: string): string {
  if (!html.includes('data-section')) return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const exported of template.content.querySelectorAll<HTMLElement>('section[data-section]')) {
    const node = document.createElement('div');
    node.setAttribute('data-type', 'section');
    for (const [name, value] of Object.entries(sectionAttrsOf(exported))) node.setAttribute(name, value);
    node.append(...exported.childNodes);
    exported.replaceWith(node);
  }
  return template.innerHTML;
}

const SectionPaste = Extension.create({
  name: 'sectionPaste',
  addProseMirrorPlugins: () => [new Plugin({ props: { transformPastedHTML: pastedSections } })],
});

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
    // A section sits only at the top: one inside a block that holds blocks reads as the blocks it holds, as does one a
    // codec copied out of the page to read it, as the table does a cell's blocks.
    const nested = !element.isConnected || element.parentElement?.closest(BLOCK_HOLDERS);
    if (!element.hasAttribute('data-section') || nested) return null;
    const content = linesOf(ctx.fromHTMLChildren(element));
    return {
      type: 'section',
      attrs: sectionAttrsOf(element),
      content: content.length > 0 ? content : [{ type: 'paragraph' }],
    };
  },
  fromMarkdown: () => null,
};

/**
 * A section: blocks set together on a background from the theme's tokens, inside a padding, at the content's width,
 * wider, or the editor's full width. It holds any block but a section, and sits only at the top of the document,
 * never in a lane, a callout, a quote, a list or a table. Its slash item runs `insertSection` and its floating
 * toolbar `setSectionLayout`, both of which the standard kit's block layout declares. HTML keeps it whole; Markdown, which has no section, writes its blocks in order.
 */
export function section(options: SectionOptions = {}): EditorFeature {
  const [sectionNode] = sectionNodeSpecs();
  const words = () => layoutWordsOf(options.messages);
  const widths = options.widths ?? SECTION_WIDTHS;
  return defineFeature({
    id: 'section',
    nodes: [{ ...sectionNode, render: sectionView(words, widths, options.changeable) }],
    codecs: [sectionCodec as NodeCodec],
    advanced: { engineExtensions: [SectionPaste] },
    slash: [
      {
        id: 'section',
        icon: LayoutPanelTopIcon,
        title: words().section,
        description: words().sectionDescription,
        group: 'Blocks',
        keywords: ['section', 'background', 'band', 'layout'],
        command: 'insertSection',
      },
    ],
  });
}
