import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { BrandMark, BrandMarkStyleProvider, setBrandMarkStyle, useBrandMarkStyle } from './brand-mark';

/** A base holding claude's mono file alone: its colour file and every other mark's files answer 404. */
const MONO_ONLY = '/src/test/brands';

/** The package's own artwork, where every mark's files load. */
const ARTWORK = '/assets/brands';

describe('BrandMark', () => {
  it('falls from a colour file that does not load to the mono file', async () => {
    await render(<BrandMark name="claude" base={MONO_ONLY} label="Claude" />);

    const mark = page.getByRole('img', { name: 'Claude' });
    await expect.element(mark).not.toHaveAttribute('src');
    await expect.element(mark).not.toHaveTextContent('C');
  });

  it('falls past every file that does not load to the first letter of the name', async () => {
    await render(<BrandMark name="openai" base={MONO_ONLY} label="OpenAI" />);

    await expect.element(page.getByRole('img', { name: 'OpenAI' })).toHaveTextContent('O');
  });

  it('starts again from the top of the chain when the name changes after a failure', async () => {
    const { rerender } = await render(<BrandMark name="facebook" base={MONO_ONLY} label="Mark" />);
    await expect.element(page.getByRole('img', { name: 'Mark' })).toHaveTextContent('F');

    await rerender(<BrandMark name="claude" base={MONO_ONLY} label="Mark" />);

    await expect.element(page.getByRole('img', { name: 'Mark' })).not.toHaveTextContent('C');
  });

  it('draws in the style a child sets on the provider, and tells onStyleChange', async () => {
    function Switch() {
      const { setStyle } = useBrandMarkStyle();
      return (
        <button type="button" onClick={() => setStyle('mono')}>
          switch
        </button>
      );
    }
    const onStyleChange = vi.fn();
    try {
      await render(
        <BrandMarkStyleProvider onStyleChange={onStyleChange}>
          <Switch />
          <BrandMark name="claude" base={ARTWORK} label="Ambient" />
        </BrandMarkStyleProvider>,
      );
      const mark = page.getByRole('img', { name: 'Ambient' });
      await expect.element(mark).toHaveAttribute('src', expect.stringMatching(/\/color\/claude\.svg$/));

      await userEvent.click(page.getByRole('button', { name: 'switch' }));

      await expect.element(mark).not.toHaveAttribute('src');
      expect(onStyleChange).toHaveBeenCalledWith('mono');
    } finally {
      setBrandMarkStyle(undefined);
    }
  });
});
