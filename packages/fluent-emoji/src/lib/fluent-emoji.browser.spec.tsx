import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { FluentEmoji } from './fluent-emoji';

describe('<FluentEmoji>', () => {
  it('falls back to the native glyph when its artwork does not load', async () => {
    await render(<FluentEmoji glyph="🤯" name="exploding head" base="/no-such-emoji-base" />);

    await expect.element(page.getByRole('img', { name: 'exploding head' })).toHaveTextContent('🤯');
  });

  // The browser project runs as a reader who asked for reduced motion.
  it("draws the animated artwork's still 3D picture under reduced motion", async () => {
    await render(<FluentEmoji glyph="😀" name="grinning face" variant="anim" base="/assets" />);

    const artwork = page.getByRole('img', { name: 'grinning face' });
    await expect.poll(() => (artwork.element() as HTMLImageElement).currentSrc).toContain('/3d/');
  });
});
