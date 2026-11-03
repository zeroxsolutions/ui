import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';

import { LanguageToggleGroup } from './language-toggle-group';

// jsdom lacks the ResizeObserver and animation APIs Base UI's ToggleGroup reaches for.
beforeAll(() => {
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function renderGroup(onValueChange = vi.fn()) {
  return render(
    <LanguageToggleGroup value="en" onValueChange={onValueChange} aria-label="Language">
      <ToggleGroupItem value="en">English</ToggleGroupItem>
      <ToggleGroupItem value="vi">Tiếng Việt</ToggleGroupItem>
    </LanguageToggleGroup>,
  );
}

describe('LanguageToggleGroup', () => {
  it('presses the item carrying the current value', () => {
    renderGroup();
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Tiếng Việt' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports a newly pressed item as its value string', () => {
    const onValueChange = vi.fn();
    renderGroup(onValueChange);
    fireEvent.click(screen.getByRole('button', { name: 'Tiếng Việt' }));
    expect(onValueChange).toHaveBeenCalledWith('vi');
  });

  it('does not deselect: pressing the current item reports nothing', () => {
    const onValueChange = vi.fn();
    renderGroup(onValueChange);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('passes the group props through, so its aria-label names the group', () => {
    renderGroup();
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
  });
});
