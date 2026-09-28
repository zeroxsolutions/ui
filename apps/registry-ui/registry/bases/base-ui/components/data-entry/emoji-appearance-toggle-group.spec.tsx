import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EmojiAppearanceToggleGroup } from './emoji-appearance-toggle-group';

beforeAll(() => {
  // Base UI's ToggleGroup measures with ResizeObserver and reads animations —
  // jsdom implements neither.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

describe('EmojiAppearanceToggleGroup', () => {
  it('renders one preview swatch per Fluent style', () => {
    render(<EmojiAppearanceToggleGroup value="3d" onValueChange={vi.fn()} />);

    for (const label of ['3D style', 'Flat style', 'Modern style', 'Mono style', 'Animated style']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('previews each swatch in its own style', () => {
    render(<EmojiAppearanceToggleGroup value="3d" onValueChange={vi.fn()} />);

    const src = (label: string) =>
      screen.getByRole('button', { name: label }).querySelector('img')?.getAttribute('src');

    // Each swatch draws the sample emoji in its own artwork set, regardless of
    // the selected value — the preview *is* the option.
    expect(src('3D style')).toContain('/3d/');
    expect(src('Flat style')).toContain('/flat/');
    expect(src('Modern style')).toContain('/modern/');
    expect(src('Mono style')).toContain('/mono/');
    expect(src('Animated style')).toContain('/anim/');
  });

  it('marks the selected style as pressed', () => {
    render(<EmojiAppearanceToggleGroup value="modern" onValueChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Modern style' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '3D style' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the chosen style via onValueChange', () => {
    const onValueChange = vi.fn();
    render(<EmojiAppearanceToggleGroup value="3d" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Flat style' }));

    expect(onValueChange).toHaveBeenCalledWith('flat');
  });
});
