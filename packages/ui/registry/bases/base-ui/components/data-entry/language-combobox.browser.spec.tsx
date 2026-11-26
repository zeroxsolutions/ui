import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

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

const trigger = () => page.getByRole('combobox', { name: 'Select language' });

describe('LanguageCombobox', () => {
  it('shows the current code language in the trigger the consumer composed', async () => {
    await renderCombobox({ kind: 'code', value: 'typescript', onValueChange: vi.fn() });
    await expect.element(trigger()).toHaveTextContent('TypeScript');
  });

  it('resolves a code alias for display (ts -> TypeScript)', async () => {
    await renderCombobox({ kind: 'code', value: 'ts', onValueChange: vi.fn() });
    await expect.element(trigger()).toHaveTextContent('TypeScript');
  });

  it('labels a locale value with its native name when no locales are given', async () => {
    await renderCombobox({ value: 'en', onValueChange: vi.fn() });
    await expect.element(trigger()).toHaveTextContent('English');
  });

  it('reports the picked option as its value string', async () => {
    const onValueChange = vi.fn();
    await renderCombobox({ kind: 'code', value: 'typescript', onValueChange });
    await userEvent.click(trigger());
    await userEvent.click(page.getByRole('option', { name: 'Python' }));
    expect(onValueChange).toHaveBeenCalledWith('python');
  });

  it('lets explicit options replace the kind data', async () => {
    await renderCombobox({
      kind: 'code',
      value: 'x',
      onValueChange: vi.fn(),
      options: [{ value: 'x', label: 'Custom X' }],
    });
    await userEvent.click(trigger());
    await expect.element(page.getByRole('option', { name: 'Custom X' })).toBeVisible();
    expect(page.getByRole('option').elements()).toHaveLength(1);
  });
});
