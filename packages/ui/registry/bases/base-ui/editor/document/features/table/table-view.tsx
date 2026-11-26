'use client';

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { facadeFor, type EngineHandle } from '@zeroxsolutions/editor-core/document/advanced';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { BlockToolbar } from '../../layout/block-toolbar';
import { layoutProps } from '../../layout/layout-props';
import type { LayoutWords } from '../../layout/layout-words';
import { WidthToggle } from '../../layout/width-toggle';
import { TableBorders } from './table-borders';
import { storedShares } from './table-widths';

type TableNode = ReactNodeViewProps['node'];

/** How many columns a table's first row spans. */
function columnCountOf(node: TableNode): number {
  let count = 0;
  node.firstChild?.forEach((cell) => {
    count += typeof cell.attrs.colspan === 'number' && cell.attrs.colspan > 1 ? cell.attrs.colspan : 1;
  });
  return count;
}

/**
 * The share of the table each column is drawn at, read from the first row's cells: a table that stores no widths
 * is laid out by the browser, by what its cells hold. Equal shares where the first row spans a cell over several
 * columns, which hides the borders inside it.
 */
function drawnShares(table: HTMLTableElement, count: number): number[] {
  const cells = [...(table.rows[0]?.cells ?? [])];
  const widths = cells.map((cell) => cell.getBoundingClientRect().width);
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (cells.length !== count || total <= 0) return Array.from({ length: count }, () => 1 / count);
  return widths.map((width) => width / total);
}

/** The table's `<colgroup>`, first in it, holding one column per share; removed where `shares` is null. */
function drawColumns(table: HTMLTableElement, shares: readonly number[] | null): void {
  let group = table.querySelector<HTMLTableColElement>(':scope > colgroup');
  if (shares === null) {
    group?.remove();
    return;
  }
  if (!group) group = table.insertBefore(document.createElement('colgroup'), table.firstChild);
  while (group.children.length > shares.length) group.lastElementChild?.remove();
  while (group.children.length < shares.length) group.append(document.createElement('col'));
  shares.forEach((share, index) => {
    (group.children[index] as HTMLElement).style.width = `${share * 100}%`;
  });
}

/** Whether the engine lets the author edit, kept as it changes; the engine draws a node view again on its node only. */
function useEditable(engine: ReactNodeViewProps['editor']): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      engine.on('update', listener);
      return () => {
        engine.off('update', listener);
      };
    },
    [engine],
  );
  return useSyncExternalStore(
    subscribe,
    () => engine.isEditable,
    () => engine.isEditable,
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

/** Whether a drag is in flight on the page, as a block dragged by its grip is; its drop target must stay clear. */
function useDragInFlight(): boolean {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const start = () => setDragging(true);
    const end = () => setDragging(false);
    document.addEventListener('dragstart', start);
    document.addEventListener('dragend', end);
    document.addEventListener('drop', end);
    return () => {
      document.removeEventListener('dragstart', start);
      document.removeEventListener('dragend', end);
      document.removeEventListener('drop', end);
    };
  }, []);
  return dragging;
}

/**
 * The editable table: its rows in a `<table>` whose `<colgroup>` draws the stored column widths, a handle on each
 * border between two columns, and a floating toolbar with Full width where the editor draws one (the email's does
 * not). Its layout's `data-*` attributes are the Viewer's.
 */
export function TableView({
  node,
  editor: engine,
  getPos,
  words,
  changeable,
}: ReactNodeViewProps & {
  words: () => LayoutWords;
  changeable?: (editor: IEditor, pos: number) => boolean;
}): ReactNode {
  const editor = facadeFor(engine as unknown as EngineHandle) as unknown as IEditor;
  const editable = useEditable(engine);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [preview, setPreview] = useState<number[] | null>(null);
  const [measured, setMeasured] = useState<number[] | null>(null);
  const active = useHoldsCaret(editor, root);
  const dragging = useDragInFlight();
  const count = columnCountOf(node);
  const stored = storedShares(node.attrs.columnWidths, count);
  const table = root?.querySelector<HTMLTableElement>(':scope > .tableWrapper > table') ?? null;

  useLayoutEffect(() => {
    if (table) drawColumns(table, preview ?? stored);
  });
  // A table that stores no widths draws its borders where the browser laid its columns out.
  useEffect(() => {
    if (!table || stored !== null) return;
    const measure = () =>
      setMeasured((current) => {
        const next = drawnShares(table, count);
        return current?.join() === next.join() ? current : next;
      });
    const sizes = new ResizeObserver(measure);
    sizes.observe(table);
    measure();
    return () => sizes.disconnect();
  }, [table, stored === null, count]);

  const pos = getPos();
  const editing = editable && pos !== undefined && (changeable?.(editor, pos) ?? true);
  const shares = preview ?? stored ?? measured ?? Array.from({ length: count }, () => 1 / count);
  const full = node.attrs.width === 'full';
  const offersFull =
    editing && pos !== undefined && (full || editor.can('setBlockLayout', { pos, layout: { width: 'full' } }));
  const layout = words();
  return (
    <NodeViewWrapper
      ref={setRoot}
      data-slot="table"
      {...layoutProps({
        width: node.attrs.width,
        spaceBefore: node.attrs.spaceBefore,
        spaceAfter: node.attrs.spaceAfter,
      })}
      data-sized={preview !== null || stored !== null || undefined}
      data-active={active || undefined}
      className="group/table relative"
    >
      <div className="tableWrapper">
        <NodeViewContent<'table'> as="table" />
      </div>
      {editing && count >= 2 && (
        <TableBorders
          table={table}
          shares={shares}
          words={layout}
          onPreview={setPreview}
          onCommit={(columnWidths) => editor.run('setTableLayout', { pos: getPos(), columnWidths })}
        />
      )}
      {offersFull && !dragging && (
        <BlockToolbar editor={editor} pos={pos} anchor={root} label={layout.toolbar}>
          <WidthToggle
            full={full}
            onChange={(bleed) =>
              editor.run('setBlockLayout', { pos: getPos(), layout: { width: bleed ? 'full' : null } })
            }
            words={layout}
          />
        </BlockToolbar>
      )}
    </NodeViewWrapper>
  );
}
