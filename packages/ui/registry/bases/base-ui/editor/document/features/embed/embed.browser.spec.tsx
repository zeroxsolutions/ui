import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import {
  dragEndHandle,
  drawnShare,
  editorEdges,
  expectViewerMatches,
  layoutFrame,
  lineWidth,
  storedLayout,
} from '../../../../../../../test/block-layout';
import { mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { standardKit } from '../standard/index';
import { embed } from './embed';

describe('the embed block layout', () => {
  const features = [standardKit(), embed()];
  const laidOut = (layout: Record<string, unknown>): DocJSON => ({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
      { type: 'embed', attrs: { url: 'about:blank', title: 'Map', ...layout } },
      // A block the document ends on would take a trailing line on the first press, under the press.
      { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
    ],
  });
  /** Selects the block, or puts the caret in it, and waits for its layout toolbar. */
  async function select(): Promise<void> {
    // A press on the frame lands in the embedded page; the arrow key from the line before selects the block.
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{End}{ArrowRight}');
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();
  }

  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('align from the block toolbar sets data-align and survives the Viewer', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({ width: 0.5 }));
    await select();

    await userEvent.click(page.getByRole('button', { name: 'Align right' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1)).toEqual({ align: 'end', width: 0.5 }));
    await expectViewerMatches(editor, features);
  });

  it('dragging the right handle to half the column stores 0.5 in one undo step', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({}));
    await select();

    await dragEndHandle(-lineWidth() / 2);

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe(0.5));
    expect(drawnShare(layoutFrame())).toBeCloseTo(0.5, 2);
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBeNull());
  });

  it("Full width bleeds to the editor's edges", async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({ width: 0.5 }));
    await select();

    await userEvent.click(page.getByRole('button', { name: 'Full width' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe('full'));
    const drawn = layoutFrame().getBoundingClientRect();
    expect(Math.abs(drawn.left - editorEdges().left)).toBeLessThan(1);
    expect(Math.abs(drawn.right - editorEdges().right)).toBeLessThan(1);
  });
});
