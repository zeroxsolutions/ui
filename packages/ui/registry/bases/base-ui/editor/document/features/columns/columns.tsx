import { useEffect, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { z } from 'zod';
import { LayoutGridIcon } from '@/registry/bases/base-ui/icons/lucide/layout-grid-icon';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { columnsNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import { MAX_LANES } from '@zeroxsolutions/editor-core/template/email/index';
import { SPACES, VALIGNS, type LayoutSpace, type VAlign } from '@zeroxsolutions/editor-core/template/layout/index';
import type { ReactNodeCodec } from '../../../react-types';
import { layoutProps } from '../../layout/layout-props';
import { layoutWordsOf, type LayoutWords } from '../../layout/layout-words';
import { blockClasses, type BlockStyle } from '../button/block-style';
import { ColumnsDividers, useColumnsLaneCount } from './columns-divider';
import { ColumnsToolbar } from './columns-toolbar';

interface ColumnsAttrs extends BlockStyle {
  ratio?: number[] | null;
  valign?: VAlign | null;
  spaceBefore?: LayoutSpace | null;
}

export interface ColumnsOptions {
  /** What a column holds, as a content expression; any block when absent. The email editor's holds no columns. */
  columnContent?: string;
  /** The most lanes the toolbar adds up to, at most 4; 4 when absent. */
  maxLanes?: number;
  /** The toolbar's and the dividers' words over the English, or a getter read on each draw. */
  messages?: Partial<LayoutWords> | (() => LayoutWords);
  /**
   * Whether the author may weigh, add to or align the columns block at `pos`; always when absent. The email editor
   * refuses in locked structure and on a block the host requires, and draws no toolbar and no divider there.
   */
  changeable?(editor: IEditor, pos: number): boolean;
}

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

const valignOf = (value: unknown): VAlign | undefined => VALIGNS.find((valign) => valign === value);

// The columns are the content element's children, so the grid is drawn on it in `styles.css`; an absent ratio
// leaves them equal.
function ColumnsShell({
  attrs,
  active,
  ref,
  children,
}: {
  attrs: ColumnsAttrs;
  /** Whether the caret is in the block, which shows its dividers. */
  active?: boolean;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const ratio = weightsOf(attrs.ratio);
  const style = ratio
    ? ({ '--columns-ratio': ratio.map((share) => `minmax(0, ${share}fr)`).join(' ') } as CSSProperties)
    : undefined;
  return (
    <div
      ref={ref}
      data-slot="columns"
      data-valign={valignOf(attrs.valign)}
      data-active={active || undefined}
      {...layoutProps({ spaceBefore: attrs.spaceBefore, spaceAfter: attrs.spaceAfter })}
      style={style}
      className={`group/columns relative ${blockClasses(attrs)}`}
    >
      {children}
    </div>
  );
}

function ColumnShell({ children }: { children: ReactNode }) {
  return (
    <div data-slot="column" className="cn-editor-lane h-full min-w-0 border border-dashed">
      {children}
    </div>
  );
}

/** Whether the caret is inside `root`, kept as the selection moves. */
function useHoldsCaret(editor: IEditor, root: HTMLElement | null): boolean {
  const [holds, setHolds] = useState(false);
  useEffect(() => {
    if (!root) return;
    const update = () => {
      const focus = window.getSelection()?.focusNode;
      setHolds(editor.isFocused() && focus != null && root.contains(focus));
    };
    update();
    const offSelection = editor.onSelectionUpdate(update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      offSelection();
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, [editor, root]);
  return holds;
}

function ColumnsView({
  attrs,
  children,
  editor,
  editable,
  getPos,
  options,
}: NodeViewProps<ColumnsAttrs> & { options: ColumnsOptions }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<number[] | null>(null);
  const lanes = useColumnsLaneCount(root);
  const active = useHoldsCaret(editor, root);
  const pos = getPos();
  const words = layoutWordsOf(options.messages);
  const changeable = editable && pos !== undefined && (options.changeable?.(editor, pos) ?? true);
  const stored = weightsOf(attrs.ratio);
  const weights = stored?.length === lanes ? stored : Array.from({ length: lanes }, () => 1);
  const set = (args: { ratio?: number[]; lanes?: number; valign?: VAlign }) =>
    editor.run('setColumnsLayout', { pos: getPos(), ...args });
  return (
    <ColumnsShell ref={setRoot} attrs={{ ...attrs, ratio: preview ?? attrs.ratio }} active={active}>
      {children as ReactNode}
      {changeable && lanes >= 2 && (
        <>
          <ColumnsDividers
            root={root}
            weights={preview ?? weights}
            words={words}
            onPreview={setPreview}
            onCommit={(ratio) => set({ ratio })}
          />
          <ColumnsToolbar
            editor={editor}
            pos={pos}
            anchor={root}
            lanes={lanes}
            maxLanes={Math.min(options.maxLanes ?? MAX_LANES, MAX_LANES)}
            valign={valignOf(attrs.valign)}
            words={words}
            // A lane added or removed draws the lanes equal again.
            onLanes={(count) => set({ lanes: count, ratio: Array.from({ length: count }, () => 1) })}
            onValign={(valign) => set({ valign })}
          />
        </>
      )}
    </ColumnsShell>
  );
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
      const valign = valignOf(node.attrs?.valign);
      const aligned = valign ? ` data-valign="${valign}"` : '';
      const spaceBefore = SPACES.find((space) => space === node.attrs?.spaceBefore);
      const before = spaceBefore ? ` data-space-before="${spaceBefore}"` : '';
      const spaceAfter = SPACES.find((space) => space === node.attrs?.spaceAfter);
      const space = spaceAfter ? ` data-space-after="${spaceAfter}"` : '';
      return `<div data-columns${ratio}${aligned}${before}${space}>${ctx.serializeChildren(node)}</div>`;
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
      const valign = valignOf(element.getAttribute('data-valign'));
      const spaceBefore = SPACES.find((space) => space === element.getAttribute('data-space-before'));
      const spaceAfter = SPACES.find((space) => space === element.getAttribute('data-space-after'));
      const content = ctx.fromHTMLChildren(element).filter((child) => child.type === 'column');
      if (content.length === 0) return null;
      return {
        type: 'columns',
        attrs: {
          ...(ratio && ratio.length === content.length ? { ratio } : {}),
          ...(valign ? { valign } : {}),
          ...(spaceBefore ? { spaceBefore } : {}),
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
 * Columns of blocks side by side, weighed by `ratio`, stacking on a narrow screen. In an editable editor a divider
 * between two lanes drags their share, and the block's toolbar adds and removes a lane and aligns the lanes, each
 * through `setColumnsLayout`. HTML keeps them whole; Markdown, which has no columns, writes each column's blocks in
 * order.
 */
export function columns(options: ColumnsOptions = {}): EditorFeature {
  const [columnsNode, columnNode] = columnsNodeSpecs(options.columnContent);
  return defineFeature({
    id: 'columns',
    nodes: [
      {
        ...columnsNode,
        render: (props) => <ColumnsView {...(props as NodeViewProps<ColumnsAttrs>)} options={options} />,
      },
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
