import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

// The browser project runs as a reader who asked for reduced motion. The classes are the ones a popover's slot
// gives its popup as it opens and closes.
describe('styles.css, for a reader who asked for reduced motion', () => {
  it.each([
    ['opens', 'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-2'],
    ['closes', 'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-top-2'],
  ])('a popup that %s with a fade, a zoom and a slide is drawn where it rests at once', async (_, classes) => {
    await render(<div data-slot="popup" data-open="" data-closed="" className={classes} />);

    expect(page.getByTestId('popup').element().getAnimations()).toEqual([]);
  });
});
