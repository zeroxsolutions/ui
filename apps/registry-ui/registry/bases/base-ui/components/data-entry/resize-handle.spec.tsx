import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ResizeHandle } from './resize-handle';

beforeAll(() => {
  Element.prototype.setPointerCapture ??= vi.fn();
  Element.prototype.releasePointerCapture ??= vi.fn();
  // jsdom ships no PointerEvent, so RTL's fireEvent.pointer* would drop clientX.
  // Back it with MouseEvent, which carries the coordinate the threshold reads.
  if (!globalThis.PointerEvent) {
    globalThis.PointerEvent = class extends MouseEvent {
      pointerId: number;
      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        this.pointerId = props.pointerId ?? 0;
      }
    } as unknown as typeof PointerEvent;
  }
});

afterEach(cleanup);

describe('ResizeHandle', () => {
  it('fires onToggle on double-click', () => {
    const onToggle = vi.fn();
    const { container } = render(<ResizeHandle onDrag={() => {}} onToggle={onToggle} />);

    fireEvent.doubleClick(container.firstElementChild!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('emits onDrag deltas only after the pointer crosses the threshold', () => {
    const onDrag = vi.fn();
    const { container } = render(<ResizeHandle onDrag={onDrag} onToggle={() => {}} />);
    const handle = container.firstElementChild!;

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    // First move arms the drag (past the 4px threshold) but emits no delta yet.
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
    expect(onDrag).not.toHaveBeenCalled();
    // Subsequent moves emit the per-move delta.
    fireEvent.pointerMove(handle, { clientX: 120, pointerId: 1 });
    expect(onDrag).toHaveBeenCalledWith(10);
  });

  it('ignores sub-threshold jitter so a click never resizes', () => {
    const onDrag = vi.fn();
    const { container } = render(<ResizeHandle onDrag={onDrag} onToggle={() => {}} />);
    const handle = container.firstElementChild!;

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 102, pointerId: 1 });
    expect(onDrag).not.toHaveBeenCalled();
  });
});
