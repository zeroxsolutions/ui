import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingsOver } from '../../../../../src/test/drawings-over';
import { playMotion } from '../../../../../test/motion';
import { AnimatedGridPattern } from './animated-grid-pattern';

/** The lit cells: every rect inside the grid's inner svg. */
const squares = (): SVGRectElement[] => [
  ...page.getByTestId('animated-grid-pattern').element().querySelectorAll<SVGRectElement>(':scope svg rect'),
];

/** A positioned box of `width` by `height` px for the grid to fill. */
function Box({ width, height, children }: { width: number; height: number; children: ReactNode }): ReactNode {
  return (
    <div className="relative" style={{ width, height }}>
      {children}
    </div>
  );
}

describe('AnimatedGridPattern', () => {
  it('lights no cell in a box with no size', async () => {
    await render(
      <Box width={0} height={0}>
        <AnimatedGridPattern numSquares={10} />
      </Box>,
    );

    await expect.element(page.getByTestId('animated-grid-pattern')).toBeInTheDocument();
    expect(squares()).toHaveLength(0);
  });

  it('lights numSquares cells inside its box', async () => {
    await render(
      <Box width={400} height={200}>
        <AnimatedGridPattern numSquares={10} width={40} height={40} />
      </Box>,
    );

    await expect.poll(() => squares().length).toBe(10);
    for (const square of squares()) {
      expect(Number(square.getAttribute('x'))).toBeLessThan(400);
      expect(Number(square.getAttribute('y'))).toBeLessThan(200);
    }
  });

  // The browser project runs as a viewer who asked for reduced motion.
  it('draws its cells still at maxOpacity under reduced motion', async () => {
    await render(
      <Box width={400} height={200}>
        <AnimatedGridPattern numSquares={4} maxOpacity={0.3} />
      </Box>,
    );

    await expect.poll(() => squares().map((square) => square.getAttribute('opacity'))).toEqual(Array(4).fill('0.3'));
    const opacities = await drawingsOver(
      () =>
        squares()
          .map((square) => square.getAttribute('opacity'))
          .join(),
      300,
    );
    expect(opacities.size).toBe(1);
  });

  it('is hidden from assistive technology, as decoration', async () => {
    await render(<AnimatedGridPattern />);
    await expect.element(page.getByTestId('animated-grid-pattern')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('AnimatedGridPattern in motion', () => {
  playMotion();

  it('fades its cells in while motion is allowed', async () => {
    await render(
      <Box width={400} height={200}>
        <AnimatedGridPattern numSquares={4} duration={1} />
      </Box>,
    );

    await expect.poll(() => squares().length).toBe(4);
    const opacities = await drawingsOver(
      () =>
        squares()
          .map((square) => square.getAttribute('opacity'))
          .join(),
      300,
    );
    expect(opacities.size, 'the cells fade').toBeGreaterThan(1);
  });
});
