import type { FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem } from './emoji-appearance-toggle-group';

function renderGroup(value: FluentEmojiStyle, onValueChange = vi.fn()) {
  return render(
    <EmojiAppearanceToggleGroup value={value} onValueChange={onValueChange}>
      <EmojiAppearanceToggleGroupItem value="3d">3D</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="flat">Flat</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="modern">Modern</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="mono">Mono</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="anim">Animated</EmojiAppearanceToggleGroupItem>
    </EmojiAppearanceToggleGroup>,
  );
}

describe('EmojiAppearanceToggleGroup', () => {
  it('renders one swatch per composed item, named by its label', async () => {
    await renderGroup('3d');

    for (const label of ['3D', 'Flat', 'Modern', 'Mono', 'Animated']) {
      await expect.element(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  it('previews each swatch in its own style, whichever is selected', async () => {
    await renderGroup('3d');

    const src = (label: string) =>
      page.getByRole('button', { name: label }).element().querySelector('img')?.getAttribute('src');

    expect(src('3D')).toContain('/3d/');
    expect(src('Flat')).toContain('/flat/');
    expect(src('Modern')).toContain('/modern/');
    expect(src('Mono')).toContain('/mono/');
    expect(src('Animated')).toContain('/anim/');
  });

  it('marks the selected style as pressed', async () => {
    await renderGroup('modern');

    await expect.element(page.getByRole('button', { name: 'Modern' })).toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByRole('button', { name: '3D' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen style via onValueChange', async () => {
    const onValueChange = vi.fn();
    await renderGroup('3d', onValueChange);

    await userEvent.click(page.getByRole('button', { name: 'Flat' }));

    expect(onValueChange).toHaveBeenCalledWith('flat');
  });
});
