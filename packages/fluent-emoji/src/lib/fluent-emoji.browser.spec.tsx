import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { FluentEmoji } from './fluent-emoji';

describe('<FluentEmoji>', () => {
  it('falls back to the native glyph when its artwork does not load', async () => {
    await render(<FluentEmoji glyph="🤯" name="exploding head" base="/no-such-emoji-base" />);

    await expect.element(page.getByRole('img', { name: 'exploding head' })).toHaveTextContent('🤯');
  });
});
