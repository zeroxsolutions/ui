import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { LanguageSwitcher } from './language-switcher';

// jsdom shims Base UI's Combobox/ToggleGroup reach for on mount.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('LanguageSwitcher display forms', () => {
  it('renders the dropdown form by default, with an accessible trigger', () => {
    render(<LanguageSwitcher value="en" onValueChange={vi.fn()} locales={['en', 'vi']} />);
    // The dropdown trigger is a Combobox control carrying the accessible name.
    expect(screen.getByRole('combobox', { name: /select language/i })).toBeTruthy();
  });

  it.each(['dropdown', 'icon'] as const)('opens a Combobox list from the %s trigger', (form) => {
    render(<LanguageSwitcher form={form} kind="code" value="typescript" onValueChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', {
      name: /select language/i,
    });
    fireEvent.click(trigger);
    // Both forms open the same Combobox list.
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-slot="combobox-item"]').length).toBeGreaterThan(0);
  });

  it('shows the current code language in the dropdown trigger', () => {
    render(<LanguageSwitcher kind="code" value="typescript" onValueChange={vi.fn()} />);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('resolves a code alias for display (ts → TypeScript)', () => {
    render(<LanguageSwitcher kind="code" value="ts" onValueChange={vi.fn()} />);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('shows the search field only when searchable', () => {
    // Searchable: the popup carries a search input (inside the Combobox content).
    const { unmount } = render(<LanguageSwitcher kind="code" searchable value="typescript" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('combobox', { name: /select language/i }));
    expect(document.querySelector('[data-slot="combobox-content"] input')).toBeTruthy();
    unmount();

    // Not searchable: the same popup opens with no input — just the list.
    render(<LanguageSwitcher kind="code" searchable={false} value="typescript" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('combobox', { name: /select language/i }));
    expect(document.querySelector('[data-slot="combobox-content"] input')).toBeNull();
  });
});

describe('LanguageSwitcher form="segmented"', () => {
  const localeOpts = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
  ];

  it('renders every option inline and reports a selection (controlled)', () => {
    const onValueChange = vi.fn();
    render(<LanguageSwitcher form="segmented" value="en" onValueChange={onValueChange} options={localeOpts} />);
    expect(screen.getByText('English')).toBeTruthy();
    fireEvent.click(screen.getByText('Tiếng Việt'));
    expect(onValueChange).toHaveBeenCalledWith('vi');
  });

  it('does not deselect on its own — clicking the current option is a no-op', () => {
    const onValueChange = vi.fn();
    render(<LanguageSwitcher form="segmented" value="en" onValueChange={onValueChange} options={localeOpts} />);
    fireEvent.click(screen.getByText('English'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('lets explicit options override the kind data', () => {
    render(
      <LanguageSwitcher
        form="segmented"
        kind="code"
        value="x"
        onValueChange={vi.fn()}
        options={[{ value: 'x', label: 'Custom X' }]}
      />,
    );
    expect(screen.getByText('Custom X')).toBeTruthy();
    expect(screen.queryByText('TypeScript')).toBeNull();
  });
});

describe('LanguageSwitcher type contract', () => {
  it('rejects `searchable` on the segmented form (type-level guarantee)', () => {
    const element = (
      // @ts-expect-error `searchable` is not a prop of the `segmented` form
      <LanguageSwitcher form="segmented" value="en" onValueChange={() => {}} searchable />
    );
    expect(element).toBeTruthy();
  });
});
