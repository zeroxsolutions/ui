import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Meteors } from './meteors';

// The browser project runs as a viewer who asked for reduced motion.
describe('Meteors under reduced motion', () => {
  it('draws no meteor', async () => {
    const screen = await render(
      <div className="relative h-40 w-80">
        <Meteors number={5} />
      </div>,
    );
    const meteors = [...screen.container.querySelectorAll<HTMLElement>('[data-slot=meteors] > span')];

    await expect.poll(() => meteors.length).toBe(5);
    expect(meteors.map((meteor) => getComputedStyle(meteor).display)).toEqual(Array(5).fill('none'));
  });
});
