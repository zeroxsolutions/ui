import type { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { LayoutGridIcon } from '@/registry/bases/base-ui/icons/lucide/layout-grid-icon';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { columnsNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import type { ReactNodeCodec } from '../../../react-types';
import { blockClasses, type BlockStyle } from '../button/block-style';

interface ColumnsAttrs extends BlockStyle {
  ratio?: number[] | null;
}

export interface ColumnsOptions {
  /** What a column holds, as a content expression; any block when absent. The email editor's holds no columns. */
  columnContent?: string;
}

const SPACES = ['small', 'medium', 'large'] as const;
/** The heaviest a column may weigh against its siblings: a twelve-column grid. */
const COLUMN_WEIGHT_MAX = 12;

/**
 * The stored ratio as weights: two or more whole numbers from 1 to 12, or null. A ratio a paste or a stored
 * document holds in another shape is never drawn or written, since it would reach a style or an attribute.
 */
function weightsOf(ratio: unknown): number[] | null {
  const valid =
    Array.isArray(ratio) &&
    ratio.length >= 2 &&
    ratio.every((weight) => Number.isInteger(weight) && weight >= 1 && weight <= COLUMN_WEIGHT_MAX);
  return valid ? (ratio as number[]) : null;
}

// The columns are the content element's children, so the grid is drawn on it in `styles.css`; an absent ratio
// leaves them equal.
function ColumnsShell({ attrs, children }: { attrs: ColumnsAttrs; children: ReactNode }) {
  const ratio = weightsOf(attrs.ratio);
  const style = ratio
    ? ({ '--columns-ratio': ratio.map((share) => `minmax(0, ${share}fr)`).join(' ') } as CSSProperties)
    : undefined;
  return (
    <div data-slot="columns" style={style} className={blockClasses(attrs)}>
      {children}
    </div>
  );
}

function ColumnShell({ children }: { children: ReactNode }) {
  return (
    <div data-slot="column" className="cn-editor-block h-full min-w-0 border border-dashed p-2">
      {children}
    </div>
  );
}

function ColumnsView({ attrs, children }: NodeViewProps<ColumnsAttrs>) {
  return <ColumnsShell attrs={attrs}>{children as ReactNode}</ColumnsShell>;
}

function ColumnView({ children }: NodeViewProps) {
  return <ColumnShell>{children as ReactNode}</ColumnShell>;
}

/** Children wrapped as the engine wraps a view's content, which the rules in `styles.css` select. */
function ColumnsContent({ children }: { children: ReactNode }) {
  return (
    <div data-node-view-content="">
      <div data-node-view-content-react="">{children}</div>
    </div>
  );
}

/** `raw` as a ratio: two or more whole weights from 1 to 12, or nothing. */
function ratioOf(raw: string | null): number[] | undefined {
  const weights = (raw ?? '').split(',').map((part) => Number(part.trim()));
  const valid = weights.length >= 2 && weights.every((weight) => Number.isInteger(weight) && weight >= 1);
  return valid && weights.every((weight) => weight <= COLUMN_WEIGHT_MAX) ? weights : undefined;
}

const columnsCodecs: ReactNodeCodec[] = [
  {
    node: 'columns',
    toHTML: (node, ctx) => {
      const weights = weightsOf(node.attrs?.ratio);
      const ratio = weights === null ? '' : ` data-ratio="${weights.join(',')}"`;
      const spaceAfter = SPACES.find((space) => space === node.attrs?.spaceAfter);
      const space = spaceAfter ? ` data-space-after="${spaceAfter}"` : '';
      return `<div data-columns${ratio}${space}>${ctx.serializeChildren(node)}</div>`;
    },
    // Markdown has no columns: each column's blocks in order, a blank line between columns.
    toMarkdown: (node, ctx) =>
      (node.content ?? [])
        .map((column) => ctx.serializeNode(column))
        .filter((markdown) => markdown.trim() !== '')
        .join('\n\n'),
    toReact: (node, ctx) => (
      <ColumnsShell attrs={(node.attrs ?? {}) as ColumnsAttrs}>
        <ColumnsContent>{ctx.renderChildren(node)}</ColumnsContent>
      </ColumnsShell>
    ),
    fromHTML: (element, ctx) => {
      if (!element.hasAttribute('data-columns')) return null;
      const ratio = ratioOf(element.getAttribute('data-ratio'));
      const spaceAfter = SPACES.find((space) => space === element.getAttribute('data-space-after'));
      const content = ctx.fromHTMLChildren(element).filter((child) => child.type === 'column');
      if (content.length === 0) return null;
      return {
        type: 'columns',
        attrs: {
          ...(ratio && ratio.length === content.length ? { ratio } : {}),
          ...(spaceAfter ? { spaceAfter } : {}),
        },
        content,
      };
    },
    fromMarkdown: () => null,
  },
  {
    node: 'column',
    toHTML: (node, ctx) => `<div data-column>${ctx.serializeChildren(node)}</div>`,
    toMarkdown: (node, ctx) => ctx.serializeChildren(node),
    toReact: (node, ctx) => (
      <ColumnShell>
        <ColumnsContent>{ctx.renderChildren(node)}</ColumnsContent>
      </ColumnShell>
    ),
    fromHTML: (element, ctx) => {
      // Only a columns block holds a column; one anywhere else reads as the blocks it holds.
      if (!element.hasAttribute('data-column') || !element.parentElement?.hasAttribute('data-columns')) return null;
      const content = linesOf(ctx.fromHTMLChildren(element));
      // A column holds at least one block, so an empty one reads as an empty line.
      return { type: 'column', content: content.length > 0 ? content : [{ type: 'paragraph' }] };
    },
    fromMarkdown: () => null,
  },
];

const emptyColumn = (): NodeJSON => ({ type: 'column', content: [{ type: 'paragraph' }] });

/** The inline nodes HTML may hold loose in a column, which only a paragraph holds in a document. */
const INLINE = new Set(['text', 'hardBreak']);

/** `nodes` with each run of loose inline nodes in a paragraph of its own, so a column holds blocks only. */
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

/**
 * Columns of blocks side by side, weighed by `ratio`, stacking on a narrow screen. HTML keeps them whole;
 * Markdown, which has no columns, writes each column's blocks in order.
 */
export function columns(options: ColumnsOptions = {}): EditorFeature {
  const [columnsNode, columnNode] = columnsNodeSpecs(options.columnContent);
  return defineFeature({
    id: 'columns',
    nodes: [
      { ...columnsNode, render: ColumnsView },
      { ...columnNode, render: ColumnView },
    ],
    codecs: columnsCodecs as NodeCodec[],
    commands: {
      insertColumns: {
        args: z.object({ count: z.number().int().min(2).max(4).default(2) }).optional(),
        run: (editor, args) => {
          const count = args?.count ?? 2;
          return editor.run('insertContent', {
            content: {
              type: 'columns',
              attrs: { ratio: Array.from({ length: count }, () => 1) },
              content: Array.from({ length: count }, emptyColumn),
            },
          });
        },
      },
    },
    slash: [
      {
        id: 'columns',
        icon: LayoutGridIcon,
        title: 'Columns',
        description: 'Blocks side by side',
        group: 'Blocks',
        keywords: ['columns', 'lanes', 'side by side', 'layout'],
        command: 'insertColumns',
      },
    ],
  });
}
