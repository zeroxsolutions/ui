import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page, userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { centreOf, mouse, touch, type Point } from '../../../../../../../test/pointer';
import { Editor } from '../../react/editor';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { table } from './table';

const features: EditorFeature[] = [standardKit(), table()];

const cell = (type: 'tableHeader' | 'tableCell', text: string, colwidth?: number[]): NodeJSON => ({
  type,
  ...(colwidth ? { attrs: { colwidth } } : {}),
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

/** A line, then a table of `attrs` with a header row and a body row of `columns` columns. */
function tableDoc(attrs: Record<string, unknown> = {}, columns = 2, colwidths?: number[]): DocJSON {
  const row = (type: 'tableHeader' | 'tableCell', prefix: string) => ({
    type: 'tableRow',
    content: Array.from({ length: columns }, (_, index) =>
      cell(type, `${prefix}${index + 1}`, type === 'tableHeader' && colwidths ? [colwidths[index]] : undefined),
    ),
  });
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
      { type: 'table', attrs, content: [row('tableHeader', 'H'), row('tableCell', 'C')] },
    ],
  };
}

async function mount(content: DocJSON): Promise<{ editor: IEditor; changes: () => number }> {
  let ready: IEditor | null = null;
  let changes = 0;
  await render(
    <div className="style-nova p-12">
      <Editor
        features={features}
        content={content}
        onReady={(editor) => (ready = editor)}
        onChange={() => (changes += 1)}
      />
    </div>,
  );
  const editor = await vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
  if (content.content?.some((node) => node.type === 'table')) {
    await vi.waitFor(() => expect(document.querySelector('.ProseMirror [data-slot=table] table')).not.toBeNull());
  }
  return { editor, changes: () => changes };
}

const tableOf = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'table');
const drawnTable = () => document.querySelector<HTMLElement>('.ProseMirror table') as HTMLElement;
const borders = () => [...document.querySelectorAll<HTMLElement>('[data-slot=table-border]')];
/** The drawn width of each column, as a share of the table. */
const drawnShares = () => {
  const cells = [...drawnTable().querySelectorAll('tr:first-child > *')].map(
    (element) => element.getBoundingClientRect().width,
  );
  const total = cells.reduce((sum, width) => sum + width, 0);
  return cells.map((width) => width / total);
};
/** The point at `share` of the table's width, from its left edge, level with the first border. */
function across(share: number): Point {
  const rect = drawnTable().getBoundingClientRect();
  return { x: rect.left + rect.width * share, y: centreOf(borders()[0]).y };
}

async function dragBorder(index: number, to: Point): Promise<void> {
  const from = centreOf(borders()[index]);
  await mouse('press', from);
  for (let step = 1; step <= 4; step += 1) await mouse('move', { x: from.x + ((to.x - from.x) * step) / 4, y: from.y });
  await mouse('release', { x: to.x, y: from.y });
}

const sumOf = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0);

afterEach(async () => {
  await page.viewport(414, 896);
});

describe('the table in the Document Editor', () => {
  it('dragging a column border stores fractions summing to 1, in one undo step', async () => {
    await page.viewport(1000, 700);
    const { editor, changes } = await mount(tableDoc());

    await dragBorder(0, across(0.3));
    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.3, 0.7]));
    expect(changes()).toBe(1);
    expect(drawnShares()[0]).toBeCloseTo(0.3, 1);
    // No cell keeps a pixel width of the engine's own.
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/"colwidth":\[/);

    await userEvent.click(page.getByText('Before'));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths ?? null).toBeNull());
  });

  it('no column goes below a twentieth, and Escape mid-drag keeps the widths', async () => {
    await page.viewport(1000, 700);
    const { editor, changes } = await mount(tableDoc({}, 3));

    await dragBorder(0, across(0));
    await vi.waitFor(() => expect((tableOf(editor)?.attrs?.columnWidths as number[] | undefined)?.[0]).toBe(0.05));
    const widths = tableOf(editor)?.attrs?.columnWidths as number[];
    expect(sumOf(widths)).toBeCloseTo(1, 4);
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(0.05);

    const from = centreOf(borders()[1]);
    await mouse('press', from);
    await mouse('move', { x: across(0.95).x, y: from.y });
    await userEvent.keyboard('{Escape}');
    await mouse('release', { x: across(0.95).x, y: from.y });
    expect(tableOf(editor)?.attrs?.columnWidths).toEqual(widths);
    expect(changes()).toBe(1);
  });

  it("no column goes narrower than its cell's padding and one character, at a narrow width", async () => {
    await page.viewport(375, 700);
    const { editor } = await mount(tableDoc({}, 4));
    const cellBox = drawnTable().querySelector<HTMLElement>('tr:first-child > *')!;
    const style = getComputedStyle(cellBox);
    const sides = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;
    const probe = document.createElement('span');
    probe.textContent = '0';
    cellBox.append(probe);
    const floor = sides.reduce((sum, side) => sum + parseFloat(style[side]), 0) + probe.getBoundingClientRect().width;
    probe.remove();

    await dragBorder(0, across(0));

    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).not.toBeNull());
    const widths = tableOf(editor)?.attrs?.columnWidths as number[];
    expect(sumOf(widths)).toBeCloseTo(1, 3);
    expect(widths[0]! * drawnTable().getBoundingClientRect().width).toBeGreaterThanOrEqual(floor);
    expect(widths[0]! % 0.05).toBeCloseTo(0, 4);
    await vi.waitFor(() => expect(cellBox.getBoundingClientRect().width).toBeGreaterThanOrEqual(floor));
    await expect
      .element(page.getByRole('slider', { name: 'Border after column 1' }))
      .toHaveAttribute('aria-valuemin', String(Math.round(widths[0]! * 100)));
  });

  it('moves a border by its keys where the browser drew a column under a twentieth', async () => {
    await page.viewport(1000, 700);
    const empty: NodeJSON = { type: 'tableCell', content: [{ type: 'paragraph' }] };
    const long = cell('tableCell', 'A heading long enough to take almost all of the row the table is drawn across');
    const { editor } = await mount({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
        { type: 'table', content: [{ type: 'tableRow', content: [long, empty, empty] }] },
      ],
    });
    await vi.waitFor(() => expect(Math.min(...drawnShares())).toBeLessThan(0.05));

    await userEvent.click(page.getByRole('slider', { name: 'Border after column 1' }));
    await userEvent.keyboard('{ArrowLeft}');

    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).not.toBeNull());
    const widths = tableOf(editor)?.attrs?.columnWidths as number[];
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(0.05);
    expect(sumOf(widths)).toBeCloseTo(1, 3);
  });

  it('undoes a border moved by its keys with Mod+Z on the border itself', async () => {
    const { editor } = await mount(tableDoc({ columnWidths: [0.5, 0.5] }));
    await userEvent.click(page.getByRole('slider', { name: 'Border after column 1' }));
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.55, 0.45]));

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.5, 0.5]));
  });

  it('a border is a slider named from words, moved by a twentieth with the keys', async () => {
    const { editor } = await mount(tableDoc({ columnWidths: [0.5, 0.5] }));
    const border = page.getByRole('slider', { name: 'Border after column 1' });
    await expect.element(border).toHaveAttribute('aria-valuenow', '50');

    await userEvent.click(border);
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.55, 0.45]));
    await expect.element(border).toHaveAttribute('aria-valuetext', '55%, 45%');
  });

  it('a finger drags a border at a narrow width, and the page scrolls nothing sideways', async () => {
    await page.viewport(375, 700);
    const { editor } = await mount(tableDoc());
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    try {
      const from = centreOf(borders()[0]);
      const to = across(0.75);
      await touch('start', from);
      for (let step = 1; step <= 4; step += 1)
        await touch('move', { x: from.x + ((to.x - from.x) * step) / 4, y: from.y });
      await touch('end', to);

      await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.75, 0.25]));
      expect(document.scrollingElement?.scrollWidth).toBeLessThanOrEqual(375);
    } finally {
      await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  });

  it('a stored table with pixel colwidths opens with the same proportions', async () => {
    await page.viewport(1000, 700);
    const { editor, changes } = await mount(tableDoc({}, 2, [100, 300]));

    expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.25, 0.75]);
    expect(drawnShares()[0]).toBeCloseTo(0.25, 1);
    expect(changes()).toBe(0);
  });

  it('a table pasted with pixel colwidths takes the same proportions as fractions, in one undo step', async () => {
    await page.viewport(1000, 700);
    const { editor } = await mount({ type: 'doc', content: [{ type: 'paragraph' }] });
    const source = document.createElement('div');
    source.contentEditable = 'true';
    source.innerHTML =
      '<table><tbody><tr><td colwidth="100"><p>a</p></td><td colwidth="300"><p>b</p></td></tr></tbody></table>';
    document.body.append(source);
    await userEvent.click(source);
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.copy();
    source.remove();

    await userEvent.click(document.querySelector<HTMLElement>('.ProseMirror p')!);
    await userEvent.paste();

    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.columnWidths).toEqual([0.25, 0.75]));
    expect(JSON.stringify(editor.getJSON())).not.toContain('colwidth":[');
    expect(drawnShares()[0]).toBeCloseTo(0.25, 1);
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(tableOf(editor)).toBeUndefined());
  });

  it("Full width bleeds to the editor's edges, and the Viewer draws the same", async () => {
    await page.viewport(1000, 700);
    const { editor } = await mount(tableDoc());
    const line = page.getByText('Before').element().getBoundingClientRect();
    expect(drawnTable().getBoundingClientRect().width).toBeCloseTo(line.width, 0);

    await userEvent.click(page.getByText('C1', { exact: true }));
    await userEvent.click(page.getByRole('button', { name: 'Full width' }));
    await vi.waitFor(() => expect(tableOf(editor)?.attrs?.width).toBe('full'));
    const editable = document.querySelector('.ProseMirror') as HTMLElement;
    const bled = drawnTable().getBoundingClientRect();
    expect(bled.width).toBeGreaterThan(line.width);
    expect(bled.left).toBeCloseTo(editable.getBoundingClientRect().left, 0);
    expect(bled.right).toBeCloseTo(editable.getBoundingClientRect().right, 0);

    await render(<Viewer doc={editor.getJSON()} features={features} />);
    const viewer = await vi.waitFor(() => {
      const drawn = document.querySelector<HTMLElement>(
        '[data-editor=document]:not(:has(.ProseMirror)) [data-slot=table]',
      );
      if (!drawn) throw new Error('the Viewer drew no table');
      return drawn;
    });
    expect(viewer.getAttribute('data-width')).toBe('full');
    expect(viewer.querySelector('table')?.getBoundingClientRect().width).toBeCloseTo(
      (viewer.parentElement as HTMLElement).getBoundingClientRect().width,
      0,
    );
  });
});
