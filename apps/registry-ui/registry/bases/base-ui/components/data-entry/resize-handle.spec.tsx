import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    const { container } = render(<ResizeHandle onDrag={() => {}} onToggle={onToggle} value={200} />);

    fireEvent.doubleClick(container.firstElementChild!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("runs the consumer's own pointer and double-click handlers beside its own", () => {
    const onToggle = vi.fn();
    const onDrag = vi.fn();
    const onDoubleClick = vi.fn();
    const onPointerDown = vi.fn();
    const { container } = render(
      <ResizeHandle
        onDrag={onDrag}
        onToggle={onToggle}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        value={200}
      />,
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
    const { container } = render(<ResizeHandle onDrag={onDrag} onToggle={() => {}} value={200} />);
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
    const { container } = render(<ResizeHandle onDrag={onDrag} onToggle={() => {}} value={200} />);
    const handle = container.firstElementChild!;

    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 102, pointerId: 1 });
    expect(onDrag).not.toHaveBeenCalled();
  });

  it('is a focusable vertical separator reporting the width it is given', () => {
    render(
      <ResizeHandle aria-label="Resize panel" value={200} min={120} max={320} onDrag={() => {}} onToggle={() => {}} />,
    );
    const handle = screen.getByRole('separator', { name: 'Resize panel' });

    handle.focus();
    expect(document.activeElement).toBe(handle);
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('aria-valuenow')).toBe('200');
    expect(handle.getAttribute('aria-valuemin')).toBe('120');
    expect(handle.getAttribute('aria-valuemax')).toBe('320');
  });

  it('resizes by its step on the arrow keys and toggles on Enter', () => {
    const onDrag = vi.fn();
    const onToggle = vi.fn();
    render(<ResizeHandle aria-label="Resize panel" value={200} step={16} onDrag={onDrag} onToggle={onToggle} />);
    const handle = screen.getByRole('separator', { name: 'Resize panel' });

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.keyDown(handle, { key: 'Enter' });

    expect(onDrag.mock.calls).toEqual([[16], [-16]]);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('resizes by 10px a press when no step is given', () => {
    const onDrag = vi.fn();
    render(<ResizeHandle aria-label="Resize panel" value={200} onDrag={onDrag} onToggle={() => {}} />);

    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize panel' }), { key: 'ArrowRight' });

    expect(onDrag).toHaveBeenCalledWith(10);
  });

  it("skips its own key action when the caller's onKeyDown prevents the default", () => {
    const onDrag = vi.fn();
    const onToggle = vi.fn();
    render(
      <ResizeHandle
        aria-label="Resize panel"
        value={200}
        onDrag={onDrag}
        onToggle={onToggle}
        onKeyDown={(event) => event.preventDefault()}
      />,
    );
    const handle = screen.getByRole('separator', { name: 'Resize panel' });

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'Enter' });

    expect(onDrag).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
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
        value={200}
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
        value={200}
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
        value={200}
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
        value={200}
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
