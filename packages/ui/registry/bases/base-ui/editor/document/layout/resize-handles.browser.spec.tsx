import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page, userEvent } from 'vitest/browser';
import { z } from 'zod';
import {
  defineFeature,
  type DocJSON,
  type EditorFeature,
  type IEditor,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { centreOf, mouse, touch, type Point } from '../../../../../../test/pointer';
import { standardKit } from '../features/standard/index';
import { Editor } from '../react/editor';
import { layoutProps } from './layout-props';
import { DEFAULT_LAYOUT_WORDS } from './layout-words';
import { ResizeHandles } from './resize-handles';

const boxAttrs = z.object({
  width: z
    .union([z.number(), z.literal('full')])
    .nullable()
    .default(null),
  align: z.enum(['start', 'center', 'end']).nullable().default(null),
});

/** A block drawn as a media block's view draws: its layout on its box, the handles inside it. */
function BoxView({ attrs, editor, getPos }: NodeViewProps<z.infer<typeof boxAttrs>>): ReactNode {
  const [preview, setPreview] = useState<number | null>(null);
  return (
    <div data-testid="box" {...layoutProps({ ...attrs, width: preview ?? attrs.width })} className="relative h-24">
      <ResizeHandles
        value={typeof attrs.width === 'number' ? attrs.width : 1}
        align={attrs.align ?? 'start'}
        words={DEFAULT_LAYOUT_WORDS}
        onPreview={setPreview}
        onCommit={(width) => {
          setPreview(null);
          editor.run('setBlockLayout', { pos: getPos(), layout: { width } });
        }}
        onCancel={() => setPreview(null)}
      />
    </div>
  );
}

const box: EditorFeature = defineFeature({
  id: 'box',
  nodes: [{ name: 'box', group: 'block', atom: true, selectable: true, attrs: boxAttrs, render: BoxView }],
});

const features = [standardKit({ layout: { types: { box: ['align', 'width'] } } }), box];

function documentOf(width: number | null): DocJSON {
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
      { type: 'box', attrs: { width, align: null } },
    ],
  };
}

const widthOf = (editor: IEditor) => editor.getJSON().content?.[1]?.attrs?.width;

async function mount(width: number | null = null): Promise<{ editor: IEditor; changes: () => number }> {
  let ready: IEditor | null = null;
  let changes = 0;
  await render(
    <div className="style-nova p-4">
      <Editor
        features={features}
        content={documentOf(width)}
        onReady={(e) => (ready = e)}
        onChange={() => (changes += 1)}
      />
    </div>,
  );
  const editor = await vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
  await vi.waitFor(() => expect(document.querySelector('[data-testid=box]')).not.toBeNull());
  return { editor, changes: () => changes };
}

const boxElement = () => document.querySelector<HTMLElement>('[data-testid=box]') as HTMLElement;
const handle = (side: 'start' | 'end') =>
  document.querySelector<HTMLElement>(`[data-slot=resize-handle][data-side=${side}]`) as HTMLElement;
/** The drawn width of the box as a share of the line it sits on. */
const drawnShare = () =>
  boxElement().getBoundingClientRect().width /
  (boxElement().parentElement as HTMLElement).getBoundingClientRect().width;
const lineWidth = () => (boxElement().parentElement as HTMLElement).getBoundingClientRect().width;
const by = (point: Point, dx: number): Point => ({ x: point.x + dx, y: point.y });

/** Drags the end handle by `dx` in `steps` moves, with the mouse. */
async function dragEnd(dx: number, steps = 5): Promise<void> {
  const from = centreOf(handle('end'));
  await mouse('press', from);
  for (let step = 1; step <= steps; step += 1) await mouse('move', by(from, (dx * step) / steps));
  await mouse('release', by(from, dx));
}

async function undo(): Promise<void> {
  await userEvent.click(page.getByText('Before'));
  await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
}

afterEach(async () => {
  await page.viewport(414, 896);
});

describe('ResizeHandles', () => {
  it('a drag commits once on release and is one undo step', async () => {
    await page.viewport(800, 600);
    const { editor, changes } = await mount();
    const from = centreOf(handle('end'));
    const half = -lineWidth() / 2;

    await mouse('press', from);
    for (let step = 1; step <= 5; step += 1) await mouse('move', by(from, (half * step) / 5));
    await vi.waitFor(() => expect(drawnShare()).toBeCloseTo(0.5, 2));
    expect(changes()).toBe(0);
    await mouse('release', by(from, half));

    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.5));
    expect(changes()).toBe(1);
    await undo();
    await vi.waitFor(() => expect(widthOf(editor)).toBeNull());
  });

  it('Escape mid-drag restores the start width and leaves no history', async () => {
    await page.viewport(800, 600);
    const { editor, changes } = await mount(0.8);
    const from = centreOf(handle('end'));

    await mouse('press', from);
    await mouse('move', by(from, -lineWidth() / 4));
    await vi.waitFor(() => expect(drawnShare()).toBeCloseTo(0.55, 2));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(drawnShare()).toBeCloseTo(0.8, 2));
    await mouse('release', by(from, -lineWidth() / 4));

    expect(widthOf(editor)).toBe(0.8);
    expect(changes()).toBe(0);
    await undo();
    expect(widthOf(editor)).toBe(0.8);
    expect(editor.getText()).toContain('Before');
  });

  it('at 375px with touch the handles stay inside the block and the page does not scroll sideways', async () => {
    await page.viewport(375, 700);
    const { editor } = await mount(0.5);
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    try {
      const from = centreOf(handle('end'));
      await touch('start', from);
      for (let step = 1; step <= 4; step += 1) {
        await touch('move', by(from, -60 * step));
        expect(document.scrollingElement?.scrollWidth).toBeLessThanOrEqual(375);
      }
      await touch('end', by(from, -240));

      await vi.waitFor(() => expect(widthOf(editor)).toBe(0.25));
      const drawn = boxElement().getBoundingClientRect();
      for (const side of ['start', 'end'] as const) {
        const rect = handle(side).getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(drawn.left);
        expect(rect.right).toBeLessThanOrEqual(drawn.right);
      }
      expect(document.scrollingElement?.scrollWidth).toBeLessThanOrEqual(375);
    } finally {
      await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  });

  it('the value stays in [0.25, 1] and snaps to 0.05', async () => {
    await page.viewport(800, 600);
    const { editor } = await mount(0.5);
    const line = lineWidth();

    await dragEnd(line);
    await vi.waitFor(() => expect(widthOf(editor)).toBe(1));
    await dragEnd(-line * 0.488);
    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.5));
    await dragEnd(-line);
    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.25));
    expect(handle('end').getAttribute('aria-valuenow')).toBe('25');
    expect(handle('end').getAttribute('aria-valuetext')).toBe('Resize, 25%');
  });

  it('arrow keys step by 5 percent', async () => {
    const { editor, changes } = await mount(0.5);
    await userEvent.click(handle('end'));
    expect(document.activeElement).toBe(handle('end'));

    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.55));
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.45));
    await userEvent.keyboard('{End}');
    await vi.waitFor(() => expect(widthOf(editor)).toBe(1));
    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.25));
    expect(changes()).toBe(5);
  });

  it('names each handle from words and reads the width in percent', async () => {
    await mount(0.5);
    await expect
      .element(page.getByRole('slider', { name: 'Resize from the left edge' }))
      .toHaveAttribute('aria-valuenow', '50');
    await expect
      .element(page.getByRole('slider', { name: 'Resize from the right edge' }))
      .toHaveAttribute('aria-valuetext', 'Resize, 50%');
  });

  it('grows a centred block on both sides as one edge is dragged', async () => {
    await page.viewport(800, 600);
    const { editor } = await mount(0.5);
    // The box follows the paragraph `Before`: its six letters and the paragraph's two edges.
    editor.run('setBlockLayout', { pos: 'Before'.length + 2, layout: { align: 'center' } });
    await vi.waitFor(() => expect(boxElement().getAttribute('data-align')).toBe('center'));

    await dragEnd(lineWidth() / 8);

    await vi.waitFor(() => expect(widthOf(editor)).toBe(0.75));
  });
});
