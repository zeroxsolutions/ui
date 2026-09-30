import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem } from './emoji-appearance-toggle-group';

beforeAll(() => {
  // Base UI's ToggleGroup measures with ResizeObserver and reads animations;
  // jsdom implements neither.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

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
  it('renders one swatch per composed item, named by its label', () => {
    renderGroup('3d');

    for (const label of ['3D', 'Flat', 'Modern', 'Mono', 'Animated']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('previews each swatch in its own style', () => {
    renderGroup('3d');

    const src = (label: string) =>
      screen.getByRole('button', { name: label }).querySelector('img')?.getAttribute('src');

    // Each swatch draws the sample emoji in its own artwork set, regardless of
    // the selected value: the preview is the option.
    expect(src('3D')).toContain('/3d/');
    expect(src('Flat')).toContain('/flat/');
    expect(src('Modern')).toContain('/modern/');
    expect(src('Mono')).toContain('/mono/');
    expect(src('Animated')).toContain('/anim/');
  });

  it('marks the selected style as pressed', () => {
    renderGroup('modern');

    expect(screen.getByRole('button', { name: 'Modern' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '3D' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the chosen style via onValueChange', () => {
    const onValueChange = vi.fn();
    renderGroup('3d', onValueChange);

    fireEvent.click(screen.getByRole('button', { name: 'Flat' }));

    expect(onValueChange).toHaveBeenCalledWith('flat');
  });
});
