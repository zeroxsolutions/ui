import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useStickToBottom, type ViewportFinder } from './use-stick-to-bottom';

beforeAll(() => {
  // The `enabled` effect constructs a ResizeObserver; jsdom has none.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

// Give a node fake scroll geometry — jsdom reports 0 for all of these.
function setGeometry(
  el: HTMLElement,
  { scrollHeight, clientHeight, scrollTop }: Record<string, number>,
) {
  Object.defineProperty(el, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, 'clientHeight', {
    value: clientHeight,
    configurable: true,
  });
  // scrollTop must be writable so scrollToBottom can assign it.
  let top = scrollTop;
  Object.defineProperty(el, 'scrollTop', {
    get: () => top,
    set: (v: number) => {
      top = v;
    },
    configurable: true,
  });
}

/** Mounts the hook against a real viewport node so its scroll listener and
 *  callback ref wire up the way they do in a component (callback refs fire
 *  before effects, so the effect finds the node). */
function Harness({
  enabled,
  finder,
}: {
  enabled?: boolean;
  finder?: ViewportFinder;
}) {
  const { ref, isAtBottom, scrollToBottom } = useStickToBottom({
    enabled,
    viewportFinder: finder,
  });
  return (
    <div
      data-testid="vp"
      ref={(el) => {
        ref.current = el;
      }}
    >
      <span data-testid="state">{isAtBottom ? 'bottom' : 'away'}</span>
      <button type="button" onClick={scrollToBottom}>
        jump
      </button>
    </div>
  );
}

describe('useStickToBottom', () => {
  it('reports at-bottom initially', () => {
    render(<Harness />);
    expect(screen.getByTestId('state').textContent).toBe('bottom');
  });

  it('flips to not-at-bottom once the user scrolls away from the bottom', () => {
    render(<Harness />);
    const vp = screen.getByTestId('vp');
    // 1000 tall, 100 visible, pinned to top → 900px from the bottom.
    setGeometry(vp, { scrollHeight: 1000, clientHeight: 100, scrollTop: 0 });
    fireEvent.scroll(vp);
    expect(screen.getByTestId('state').textContent).toBe('away');
  });

  it('treats within-threshold as at-bottom (32px tolerance)', () => {
    render(<Harness />);
    const vp = screen.getByTestId('vp');
    // distance = 1000 - 880 - 100 = 20 ≤ 32 → still "at bottom".
    setGeometry(vp, { scrollHeight: 1000, clientHeight: 100, scrollTop: 880 });
    fireEvent.scroll(vp);
    expect(screen.getByTestId('state').textContent).toBe('bottom');
  });

  it('scrollToBottom re-pins to the bottom and clears the away state', () => {
    render(<Harness />);
    const vp = screen.getByTestId('vp');
    setGeometry(vp, { scrollHeight: 1000, clientHeight: 100, scrollTop: 0 });
    fireEvent.scroll(vp);
    expect(screen.getByTestId('state').textContent).toBe('away');

    fireEvent.click(screen.getByText('jump'));
    expect(vp.scrollTop).toBe(1000);
    expect(screen.getByTestId('state').textContent).toBe('bottom');
  });

  it('resolves the scrollable element via viewportFinder', () => {
    const finder: ViewportFinder = (root) =>
      root.querySelector<HTMLElement>('[data-slot="viewport"]');

    function NestedHarness() {
      const { ref, isAtBottom } = useStickToBottom({ viewportFinder: finder });
      return (
        <div
          ref={(el) => {
            ref.current = el;
          }}
        >
          <div data-slot="viewport" data-testid="inner">
            <span data-testid="state">{isAtBottom ? 'bottom' : 'away'}</span>
          </div>
        </div>
      );
    }

    render(<NestedHarness />);
    const inner = screen.getByTestId('inner');
    setGeometry(inner, { scrollHeight: 500, clientHeight: 50, scrollTop: 0 });
    fireEvent.scroll(inner);
    expect(screen.getByTestId('state').textContent).toBe('away');
  });
});
