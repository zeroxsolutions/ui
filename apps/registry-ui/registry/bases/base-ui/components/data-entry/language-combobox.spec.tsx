import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/registry/bases/base-ui/ui/combobox';
import type { LanguageOption } from '@/registry/bases/base-ui/types/language-option';

import { LanguageCombobox, type LanguageComboboxProps } from './language-combobox';

// jsdom lacks the layout and pointer APIs Base UI's Combobox reaches for on open.
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

function renderCombobox(props: Omit<LanguageComboboxProps, 'children'>) {
  return render(
    <LanguageCombobox {...props}>
      <ComboboxTrigger render={<Button variant="outline" size="sm" />} aria-label="Select language">
        <ComboboxValue>
          {(option: LanguageOption | null) => (
            <>
              {option?.icon}
              <span>{option?.label ?? 'Select'}</span>
            </>
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(option: LanguageOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon}
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </LanguageCombobox>,
  );
}

function trigger(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Select language' });
}

describe('LanguageCombobox', () => {
  it('shows the current code language in the trigger the consumer composed', () => {
    renderCombobox({ kind: 'code', value: 'typescript', onValueChange: vi.fn() });
    expect(trigger().textContent).toContain('TypeScript');
  });

  it('resolves a code alias for display (ts -> TypeScript)', () => {
    renderCombobox({ kind: 'code', value: 'ts', onValueChange: vi.fn() });
    expect(trigger().textContent).toContain('TypeScript');
  });

  it('labels a locale value with its native name when no locales are given', () => {
    renderCombobox({ value: 'en', onValueChange: vi.fn() });
    expect(trigger().textContent).toContain('English');
  });

  it('reports the picked option as its value string', () => {
    const onValueChange = vi.fn();
    renderCombobox({ kind: 'code', value: 'typescript', onValueChange });
    fireEvent.click(trigger());
    const python = screen.getAllByText('Python')[0].closest('[data-slot="combobox-item"]');
    expect(python).not.toBeNull();
    fireEvent.click(python!);
    expect(onValueChange).toHaveBeenCalledWith('python');
  });

  it('lets explicit options replace the kind data', () => {
    renderCombobox({ kind: 'code', value: 'x', onValueChange: vi.fn(), options: [{ value: 'x', label: 'Custom X' }] });
    fireEvent.click(trigger());
    expect(document.querySelectorAll('[data-slot="combobox-item"]')).toHaveLength(1);
    expect(screen.queryByText('TypeScript')).toBeNull();
  });
});
