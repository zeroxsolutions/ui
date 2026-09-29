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

  it("runs the consumer's own pointer and double-click handlers beside its own", () => {
    const onToggle = vi.fn();
    const onDrag = vi.fn();
    const onDoubleClick = vi.fn();
    const onPointerDown = vi.fn();
    const { container } = render(
      <ResizeHandle onDrag={onDrag} onToggle={onToggle} onDoubleClick={onDoubleClick} onPointerDown={onPointerDown} />,
    );
    const handle = container.firstElementChild!;

    fireEvent.doubleClick(handle);
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 120, pointerId: 1 });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenCalledWith(10);
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

describe('ResizeHandle composed handlers honor a caller preventDefault', () => {
  it("skips arming the drag when a caller's onPointerDown prevents the default, but still runs", () => {
    const onDrag = vi.fn();
    const onPointerDown = vi.fn();
    const { container } = render(
      <ResizeHandle
        onDrag={onDrag}
        onToggle={() => {}}
        onPointerDown={(event) => {
          onPointerDown(event);
          event.preventDefault();
        }}
      />,
    );
    const handle = container.firstElementChild!;

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 120, pointerId: 1 });

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("skips the drag delta when a caller's onPointerMove prevents the default, but still runs", () => {
    const onDrag = vi.fn();
    const onPointerMove = vi.fn();
    const { container } = render(
      <ResizeHandle
        onDrag={onDrag}
        onToggle={() => {}}
        onPointerMove={(event) => {
          onPointerMove(event);
          event.preventDefault();
        }}
      />,
    );
    const handle = container.firstElementChild!;

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 120, pointerId: 1 });

    expect(onPointerMove).toHaveBeenCalledTimes(2);
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("skips onToggle when a caller's onDoubleClick prevents the default, but still runs", () => {
    const onToggle = vi.fn();
    const onDoubleClick = vi.fn();
    const { container } = render(
      <ResizeHandle
        onDrag={() => {}}
        onToggle={onToggle}
        onDoubleClick={(event) => {
          onDoubleClick(event);
          event.preventDefault();
        }}
      />,
    );

    fireEvent.doubleClick(container.firstElementChild!);

    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe("ResizeHandle's cleanup handlers ignore a caller preventDefault", () => {
  it("still ends the drag when a caller's onPointerUp calls preventDefault, but still runs", () => {
    const onDrag = vi.fn();
    const onPointerUp = vi.fn();
    const { container } = render(
      <ResizeHandle
        onDrag={onDrag}
        onToggle={() => {}}
        onPointerUp={(event) => {
          onPointerUp(event);
          event.preventDefault();
        }}
      />,
    );
    const handle = container.firstElementChild!;

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 110, pointerId: 1 });
    // No pointerdown before this move - a preventDefault'd onPointerUp must
    // still end the drag, or a later hover would report a stray delta.
    fireEvent.pointerMove(handle, { clientX: 120, pointerId: 1 });

    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onDrag).not.toHaveBeenCalled();
  });
});
