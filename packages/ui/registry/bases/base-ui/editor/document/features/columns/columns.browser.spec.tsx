import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page, userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { centreOf, mouse, touch, type Point } from '../../../../../../../test/pointer';
import { Viewer } from '../../react/viewer';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { standardKit } from '../standard/index';
import { button } from '../button/index';
import { columns } from './columns';

const features: EditorFeature[] = [standardKit(), button(), columns()];

const empty: DocJSON = { type: 'doc', content: [{ type: 'paragraph' }] };
const line = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });

/** A line, then a columns block of `attrs` holding one line per text in `lanes`. */
function columnsDoc(attrs: Record<string, unknown>, ...lanes: string[]): DocJSON {
  return {
    type: 'doc',
    content: [
      line('Before'),
      { type: 'columns', attrs, content: lanes.map((text) => ({ type: 'column', content: [line(text)] })) },
    ],
  };
}

const mount = (content: DocJSON = empty): Promise<IEditor> => mountDocumentEditor(features, content);

const columnsOf = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'columns');
const lanes = () => page.getByTestId('column').elements();
const divider = () => page.getByRole('slider').first().element();

/** The point at `share` of the way across the first two lanes, from the first lane's start edge. */
function across(share: number): Point {
  const [first, second] = lanes().map((lane) => lane.getBoundingClientRect());
  return { x: first.left + (second.right - first.left) * share, y: first.top + first.height / 2 };
}

/** Drags the first divider to `to` with the mouse, in a few moves, and releases it there. */
async function dragDivider(to: Point): Promise<void> {
  const from = centreOf(divider());
  await mouse('press', from);
  for (let step = 1; step <= 4; step += 1) {
    await mouse('move', { x: from.x + ((to.x - from.x) * step) / 4, y: from.y });
  }
  await mouse('release', { x: to.x, y: from.y });
}

/** Puts the caret in the lane holding `text`, which opens the columns block's toolbar. */
async function caretIn(text: string): Promise<void> {
  await userEvent.click(page.getByText(text, { exact: true }));
  await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();
}

async function undo(): Promise<void> {
  await userEvent.click(page.getByText('Before'));
  await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
}

afterEach(async () => {
  await page.viewport(414, 896);
});

describe('the columns in the Document Editor', () => {
  it('inserts two equal columns from the slash menu, each holding a line to type in', async () => {
    const editor = await mount();
    await insertFromSlashMenu('Columns');

    await vi.waitFor(() => {
      const inserted = columnsOf(editor);
      expect(inserted?.attrs?.ratio).toEqual([1, 1]);
      expect(inserted?.content?.map((column) => column.content?.[0]?.type)).toEqual(['paragraph', 'paragraph']);
    });
    expect(lanes()).toHaveLength(2);
  });

  it('dragging the divider to two thirds stores [8, 4], and to a quarter [3, 9]', async () => {
    await page.viewport(1000, 700);
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));

    await dragDivider(across(0.64));
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([8, 4]));
    await dragDivider(across(0.27));
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([3, 9]));
  });

  it('one drag is one undo step, and Escape mid-drag keeps the ratio', async () => {
    await page.viewport(1000, 700);
    let changes = 0;
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));
    editor.onChange(() => (changes += 1));

    const from = centreOf(divider());
    await mouse('press', from);
    await mouse('move', { x: across(0.75).x, y: from.y });
    await userEvent.keyboard('{Escape}');
    await mouse('release', { x: across(0.75).x, y: from.y });
    expect(columnsOf(editor)?.attrs?.ratio).toEqual([1, 1]);
    expect(changes).toBe(0);

    await dragDivider(across(0.75));
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([9, 3]));
    expect(changes).toBe(1);
    await undo();
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([1, 1]));
  });

  it('undoes a drag with Mod+Z on the divider itself', async () => {
    await page.viewport(1000, 700);
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));

    await dragDivider(across(0.75));
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([9, 3]));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([1, 1]));
  });

  it('drags a divider the pointer reached over the lane after it, where that lane opens on a heading', async () => {
    await page.viewport(1000, 700);
    const content = columnsDoc({ ratio: [1, 1] }, 'left', 'right');
    const [, second] = content.content![1].content!;
    second.content = [{ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Right' }] }];
    const editor = await mount(content);

    // The block grip shows beside the block a pointer is over, here the heading just past the divider.
    const from = centreOf(divider());
    await mouse('move', { x: from.x + 4, y: from.y });
    await mouse('move', from);
    await dragDivider(across(0.64));
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([8, 4]));
  });

  it('the divider is a slider named from words and moves by keyboard to the next snap', async () => {
    await page.viewport(1000, 700);
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));
    const divider = page.getByRole('slider', { name: 'Divider between columns 1 and 2' });
    await expect.element(divider).toHaveAttribute('aria-valuenow', '50');
    await expect.element(divider).toHaveAttribute('aria-valuetext', '50%, 50%');

    await userEvent.click(divider);
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([8, 4]));
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([9, 3]));
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([4, 8]));
    await expect.element(divider).toHaveAttribute('aria-valuetext', '33%, 67%');
  });

  it('adds an empty lane from the toolbar up to 4, and removes the last down to 2, keeping its text', async () => {
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));
    await caretIn('left');
    const add = page.getByRole('button', { name: 'Add column' });
    const remove = page.getByRole('button', { name: 'Remove column' });
    await expect.element(remove).toBeDisabled();

    await userEvent.click(add);
    await userEvent.click(add);
    await vi.waitFor(() => expect(columnsOf(editor)?.content).toHaveLength(4));
    await expect.element(add).toBeDisabled();

    await userEvent.click(remove);
    await userEvent.click(remove);
    await vi.waitFor(() => expect(columnsOf(editor)?.content).toHaveLength(2));
    expect(editor.getText()).toContain('right');
    await expect.element(remove).toBeDisabled();
  });

  it('removing a lane holding text moves the text into the lane before it', async () => {
    const editor = await mount(columnsDoc({ ratio: [1, 1, 1] }, 'left', 'middle', 'right'));
    await caretIn('left');
    await userEvent.click(page.getByRole('button', { name: 'Remove column' }));

    await vi.waitFor(() => expect(columnsOf(editor)?.content).toHaveLength(2));
    expect(columnsOf(editor)?.content?.[1].content?.map((child) => child.content?.[0]?.text)).toEqual([
      'middle',
      'right',
    ]);
  });

  it('valign center sets data-valign in the Editor and the Viewer', async () => {
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));
    await caretIn('left');
    await userEvent.click(page.getByRole('button', { name: 'Middle' }));

    await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.valign).toBe('center'));
    await expect.element(page.getByTestId('columns')).toHaveAttribute('data-valign', 'center');

    const { container } = await render(<Viewer doc={editor.getJSON()} features={features} />);
    await expect
      .element(page.elementLocator(container).getByTestId('columns'))
      .toHaveAttribute('data-valign', 'center');
  });

  it('on a narrow screen no divider is drawn', async () => {
    await page.viewport(375, 700);
    await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));

    await expect.element(page.getByText('right', { exact: true })).toBeVisible();
    expect(page.getByRole('slider').elements()).toEqual([]);
  });

  it('a finger drags the divider as a mouse does', async () => {
    await page.viewport(800, 700);
    const editor = await mount(columnsDoc({ ratio: [1, 1] }, 'left', 'right'));
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    try {
      const from = centreOf(divider());
      const to = across(1 / 3);
      await touch('start', from);
      for (let step = 1; step <= 4; step += 1)
        await touch('move', { x: from.x + ((to.x - from.x) * step) / 4, y: from.y });
      await touch('end', { x: to.x, y: from.y });

      await vi.waitFor(() => expect(columnsOf(editor)?.attrs?.ratio).toEqual([4, 8]));
    } finally {
      await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  });
});
