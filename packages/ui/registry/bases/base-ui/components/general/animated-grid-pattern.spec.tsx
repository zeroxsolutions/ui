import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnimatedGridPattern } from './animated-grid-pattern';

/** A ResizeObserver that reports every element it observes laid out at 400 by 200. */
class LaidOut {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element): void {
    this.callback(
      [{ target, contentRect: { width: 400, height: 200 } } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
}

function stubPrefersReducedMotion(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList);
}

/** The lit cells: every rect inside the grid's inner svg. */
const squaresOf = (container: HTMLElement): SVGRectElement[] => [
  ...container.querySelectorAll<SVGRectElement>('[data-slot=animated-grid-pattern] svg rect'),
];

beforeEach(() => {
  stubPrefersReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AnimatedGridPattern', () => {
  it('lights no cell before it has been laid out', () => {
    const { container } = render(<AnimatedGridPattern numSquares={10} />);
    expect(squaresOf(container)).toHaveLength(0);
  });

  it('lights numSquares cells inside its box once it has been measured', async () => {
    vi.stubGlobal('ResizeObserver', LaidOut);
    const { container } = render(<AnimatedGridPattern numSquares={10} width={40} height={40} />);
    await act(async () => undefined);

    const squares = squaresOf(container);
    expect(squares).toHaveLength(10);
    for (const square of squares) {
      expect(Number(square.getAttribute('x'))).toBeLessThan(400);
      expect(Number(square.getAttribute('y'))).toBeLessThan(200);
    }
  });

  it('fades each cell in from nothing while motion is allowed', async () => {
    vi.stubGlobal('ResizeObserver', LaidOut);
    const { container } = render(<AnimatedGridPattern numSquares={4} />);
    await act(async () => undefined);

    expect(squaresOf(container).map((square) => square.getAttribute('opacity'))).toEqual(['0', '0', '0', '0']);
  });

  it('draws its cells still at maxOpacity under reduced motion', async () => {
    stubPrefersReducedMotion(true);
    vi.stubGlobal('ResizeObserver', LaidOut);
    const { container } = render(<AnimatedGridPattern numSquares={4} maxOpacity={0.3} />);
    await act(async () => undefined);

    const squares = squaresOf(container);
    expect(squares).toHaveLength(4);
    expect(squares.map((square) => square.getAttribute('opacity'))).toEqual(['0.3', '0.3', '0.3', '0.3']);
  });

  it('is hidden from assistive technology, as decoration', () => {
    const { container } = render(<AnimatedGridPattern />);
    expect(container.querySelector('[data-slot=animated-grid-pattern]')?.getAttribute('aria-hidden')).toBe('true');
  });
});
