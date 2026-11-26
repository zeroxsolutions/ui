import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { expect, vi } from 'vitest';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { centreOf, mouse, type Point } from './pointer';
import { Viewer } from '../registry/bases/base-ui/editor/document/react/viewer';

/** The frame a media block draws its place and width on, in the editor or under `root`. */
export function layoutFrame(root: ParentNode = document.querySelector('.ProseMirror') ?? document): HTMLElement {
  const frame = root.querySelector<HTMLElement>('[data-slot=block-layout]');
  if (!frame) throw new Error('no block layout frame is drawn');
  return frame;
}

/** The drawn width of `frame` as a share of the line it sits on. */
export function drawnShare(frame: HTMLElement): number {
  return frame.getBoundingClientRect().width / (frame.parentElement as HTMLElement).getBoundingClientRect().width;
}

/** The width handle on `side` of the block's frame. */
export function widthHandle(side: 'start' | 'end'): HTMLElement {
  const handle = layoutFrame().querySelector<HTMLElement>(`[data-slot=resize-handle][data-side=${side}]`);
  if (!handle) throw new Error(`no ${side} width handle is drawn`);
  return handle;
}

/** The layout toolbar, by its English name. */
export const layoutToolbar = () => page.getByRole('toolbar', { name: 'Block layout' });

/** Selects the block whose frame is drawn, by a press on `target` inside it, and waits for its toolbar. */
export async function selectBlock(target: Element = layoutFrame()): Promise<void> {
  await userEvent.click(target, { position: { x: 4, y: 4 } });
  await expect.element(layoutToolbar()).toBeVisible();
}

/** Drags the end handle by `dx` pixels with the mouse, in a few moves, and releases it. */
export async function dragEndHandle(dx: number): Promise<void> {
  const from: Point = centreOf(widthHandle('end'));
  await mouse('press', from);
  for (let step = 1; step <= 4; step += 1) await mouse('move', { x: from.x + (dx * step) / 4, y: from.y });
  await mouse('release', { x: from.x + dx, y: from.y });
}

/** The line the frame sits on: its width in pixels. */
export const lineWidth = (): number => (layoutFrame().parentElement as HTMLElement).getBoundingClientRect().width;

/** Draws `doc` in the Viewer beside the editor, at the editor's width, and answers the Viewer's block frame. */
export async function viewerFrame(doc: DocJSON, features: EditorFeature[], width: number): Promise<HTMLElement> {
  const screen = await render(
    <div className="style-nova" data-testid="viewer" style={{ width }}>
      <Viewer doc={doc} features={features} />
    </div>,
  );
  return vi.waitFor(() => layoutFrame(screen.container));
}

/** The layout the block at `index` of the document stores. */
export function storedLayout(editor: IEditor, index: number): { align?: unknown; width?: unknown } {
  const attrs = editor.getJSON().content?.[index]?.attrs ?? {};
  return { align: attrs.align, width: attrs.width };
}

/**
 * Draws the editor's document in the Viewer at the editor's line width and checks that its block frame carries
 * the editor's `data-align` and `data-width` and is drawn at the same share of its line, within 1%.
 */
export async function expectViewerMatches(editor: IEditor, features: EditorFeature[]): Promise<void> {
  const edited = layoutFrame();
  const viewed = await viewerFrame(editor.getJSON(), features, lineWidth());
  expect(viewed.getAttribute('data-align')).toBe(edited.getAttribute('data-align'));
  expect(viewed.getAttribute('data-width')).toBe(edited.getAttribute('data-width'));
  expect(Math.abs(drawnShare(viewed) - drawnShare(edited))).toBeLessThan(0.01);
}

/** The edges of the editable text, which a full width block bleeds to. */
export function editorEdges(): DOMRect {
  return (document.querySelector('.ProseMirror') as HTMLElement).getBoundingClientRect();
}
