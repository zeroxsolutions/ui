import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { centreOf, mouse, type Point } from '../../../../../test/pointer';

import { ResizeHandle } from './resize-handle';

/** Draws the handle between two panes of a row, as a split view places it. */
async function renderHandle(props: ComponentProps<typeof ResizeHandle>): Promise<void> {
  await render(
    <div style={{ display: 'flex', height: 120, width: 400 }}>
      <div style={{ width: 200 }}>
        <button type="button">Panel</button>
      </div>
      <ResizeHandle aria-label="Resize panel" {...props} />
      <div style={{ flex: 1 }} />
    </div>,
  );
}

const handle = () => page.getByRole('separator', { name: 'Resize panel' });

/** Moves the focus onto the handle with Tab, from the pane before it. */
async function tabToHandle(): Promise<void> {
  await userEvent.click(page.getByRole('button', { name: 'Panel' }));
  await userEvent.tab();
}

/** Each width `onDrag` was handed, in whole pixels: the browser reports a pointer's position to a fraction of one. */
function deltas(onDrag: ReturnType<typeof vi.fn>): number[] {
  return onDrag.mock.calls.map(([dx]) => Math.round(dx as number));
}

/** Presses on the handle's centre and moves the pointer by each of `steps` in turn, without releasing. */
async function pressAndMove(...steps: number[]): Promise<Point> {
  const from = centreOf(handle().element());
  await mouse('press', from);
  for (const dx of steps) await mouse('move', { x: from.x + dx, y: from.y });
  return from;
}

describe('ResizeHandle', () => {
  it('fires onToggle on double-click', async () => {
    const onToggle = vi.fn();
    await renderHandle({ onDrag: () => {}, onToggle, value: 200 });

    await userEvent.dblClick(handle());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("runs the consumer's own pointer and double-click handlers beside its own", async () => {
    const onToggle = vi.fn();
    const onDrag = vi.fn();
    const onDoubleClick = vi.fn();
    const onPointerDown = vi.fn();
    await renderHandle({ onDrag, onToggle, onDoubleClick, onPointerDown, value: 200 });

    await userEvent.dblClick(handle());
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);

    onPointerDown.mockClear();
    const from = await pressAndMove(10, 20);
    await mouse('release', { x: from.x + 20, y: from.y });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(deltas(onDrag)).toEqual([10]);
  });

  it('emits onDrag deltas only after the pointer crosses the threshold', async () => {
    const onDrag = vi.fn();
    await renderHandle({ onDrag, onToggle: () => {}, value: 200 });

    // A move inside the 4px threshold arms nothing; the first move past it arms the drag and emits no delta yet.
    const from = await pressAndMove(2, 10);
    expect(onDrag).not.toHaveBeenCalled();
    await mouse('move', { x: from.x + 20, y: from.y });
    await mouse('release', { x: from.x + 20, y: from.y });
    expect(deltas(onDrag)).toEqual([10]);
  });

  it('ignores sub-threshold jitter so a click never resizes', async () => {
    const onDrag = vi.fn();
    await renderHandle({ onDrag, onToggle: () => {}, value: 200 });

    const from = await pressAndMove(2, 3);
    await mouse('release', { x: from.x + 3, y: from.y });
    expect(onDrag).not.toHaveBeenCalled();
  });

  it('is a focusable vertical separator reporting the width it is given', async () => {
    await renderHandle({ value: 200, min: 120, max: 320, onDrag: () => {}, onToggle: () => {} });

    await tabToHandle();
    await expect.element(handle()).toHaveFocus();
    await expect.element(handle()).toHaveAttribute('aria-orientation', 'vertical');
    await expect.element(handle()).toHaveAttribute('aria-valuenow', '200');
    await expect.element(handle()).toHaveAttribute('aria-valuemin', '120');
    await expect.element(handle()).toHaveAttribute('aria-valuemax', '320');
  });

  it('resizes by its step on the arrow keys and toggles on Enter', async () => {
    const onDrag = vi.fn();
    const onToggle = vi.fn();
    await renderHandle({ value: 200, step: 16, onDrag, onToggle });

    await tabToHandle();
    await userEvent.keyboard('{ArrowRight}{ArrowLeft}{Enter}');

    expect(onDrag.mock.calls).toEqual([[16], [-16]]);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('resizes by 10px a press when no step is given', async () => {
    const onDrag = vi.fn();
    await renderHandle({ value: 200, onDrag, onToggle: () => {} });

    await tabToHandle();
    await userEvent.keyboard('{ArrowRight}');

    expect(onDrag).toHaveBeenCalledWith(10);
  });

  it("skips its own key action when the caller's onKeyDown prevents the default", async () => {
    const onDrag = vi.fn();
    const onToggle = vi.fn();
    await renderHandle({ value: 200, onDrag, onToggle, onKeyDown: (event) => event.preventDefault() });

    await tabToHandle();
    await userEvent.keyboard('{ArrowRight}{Enter}');

    expect(onDrag).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('ResizeHandle composed handlers honor a caller preventDefault', () => {
  it("skips arming the drag when a caller's onPointerDown prevents the default, but still runs", async () => {
    const onDrag = vi.fn();
    const onPointerDown = vi.fn();
    await renderHandle({
      onDrag,
      onToggle: () => {},
      value: 200,
      onPointerDown: (event) => {
        onPointerDown();
        event.preventDefault();
      },
    });

    const from = await pressAndMove(10, 20);
    await mouse('release', { x: from.x + 20, y: from.y });

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("skips the drag delta when a caller's onPointerMove prevents the default, but still runs", async () => {
    const onDrag = vi.fn();
    const onPointerMove = vi.fn();
    await renderHandle({
      onDrag,
      onToggle: () => {},
      value: 200,
      onPointerMove: (event) => {
        onPointerMove();
        event.preventDefault();
      },
    });

    const from = await pressAndMove(10, 20);
    await mouse('release', { x: from.x + 20, y: from.y });

    expect(onPointerMove).toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("skips onToggle when a caller's onDoubleClick prevents the default, but still runs", async () => {
    const onToggle = vi.fn();
    const onDoubleClick = vi.fn();
    await renderHandle({
      onDrag: () => {},
      onToggle,
      value: 200,
      onDoubleClick: (event) => {
        onDoubleClick();
        event.preventDefault();
      },
    });

    await userEvent.dblClick(handle());

    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe("ResizeHandle's cleanup handlers ignore a caller preventDefault", () => {
  it("still ends the drag when a caller's onPointerUp calls preventDefault, but still runs", async () => {
    const onDrag = vi.fn();
    const onPointerUp = vi.fn();
    await renderHandle({
      onDrag,
      onToggle: () => {},
      value: 200,
      onPointerUp: (event) => {
        onPointerUp();
        event.preventDefault();
      },
    });

    const from = await pressAndMove(10);
    await mouse('release', { x: from.x + 10, y: from.y });
    // Back over the handle with no press: a drag left armed would report the way back as a delta.
    await mouse('move', from);

    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onDrag).not.toHaveBeenCalled();
  });
});
