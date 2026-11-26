import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { setFluentEmojiStyle } from './fluent-emoji-url';
import { FluentEmoji } from './fluent-emoji';
import { FluentEmojiStyleProvider, useFluentEmojiStyle } from './fluent-emoji-style-provider';

function StyleSwitch() {
  const { setStyle } = useFluentEmojiStyle();
  return (
    <button type="button" onClick={() => setStyle('mono')}>
      switch
    </button>
  );
}

describe('FluentEmojiStyleProvider', () => {
  it('redraws a mounted <FluentEmoji> in the style a child sets, and reports the change', async () => {
    const onStyleChange = vi.fn();
    try {
      await render(
        <FluentEmojiStyleProvider defaultStyle="3d" onStyleChange={onStyleChange}>
          <FluentEmoji glyph="🤯" name="exploding head" />
          <StyleSwitch />
        </FluentEmojiStyleProvider>,
      );
      const emoji = page.getByRole('img', { name: 'exploding head' });
      await expect.element(emoji).toHaveAttribute('src', expect.stringMatching(/\/3d\/1f92f\.webp$/));

      await userEvent.click(page.getByRole('button', { name: 'switch' }));

      await expect.element(emoji).toHaveAttribute('src', expect.stringMatching(/\/mono\/1f92f\.svg$/));
      expect(onStyleChange).toHaveBeenCalledWith('mono');
    } finally {
      setFluentEmojiStyle(undefined);
    }
  });
});
