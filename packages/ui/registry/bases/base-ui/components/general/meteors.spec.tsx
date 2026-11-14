import { cleanup, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { Meteors } from './meteors';

afterEach(cleanup);

const meteorsOf = (container: HTMLElement): HTMLElement[] =>
  [...(container.firstChild as HTMLElement).children] as HTMLElement[];

describe('Meteors', () => {
  it('draws as many meteors as number asks for', () => {
    const { container, rerender } = render(<Meteors number={7} />);
    expect(meteorsOf(container)).toHaveLength(7);
    rerender(<Meteors number={3} />);
    expect(meteorsOf(container)).toHaveLength(3);
  });

  it('starts each meteor along the top, at a share of its own width rather than of the window', () => {
    const { container } = render(<Meteors number={12} />);
    for (const meteor of meteorsOf(container)) {
      expect(meteor.style.top).toBe('-5%');
      expect(meteor.style.left).toMatch(/^\d+(\.\d+)?%$/);
      expect(Number.parseFloat(meteor.style.left)).toBeLessThan(100);
    }
  });

  it('times each fall within the delays and durations it is given', () => {
    const { container } = render(<Meteors number={12} minDelay={1} maxDelay={2} minDuration={3} maxDuration={4} />);
    for (const meteor of meteorsOf(container)) {
      const delay = Number.parseFloat(meteor.style.animationDelay);
      expect(delay).toBeGreaterThanOrEqual(1);
      expect(delay).toBeLessThanOrEqual(2);
      expect(meteor.style.animationDuration).toBe('3s');
    }
  });

  it('draws no meteor in a server render, so the first client render matches it', () => {
    const html = renderToString(<Meteors number={5} />);
    expect(html).not.toContain('animate-meteor');
  });

  it('is hidden from assistive technology, as decoration', () => {
    const { container } = render(<Meteors />);
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });
});
