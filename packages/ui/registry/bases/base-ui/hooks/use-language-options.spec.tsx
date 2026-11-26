import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { LanguageOptionSource } from '@/registry/bases/base-ui/types/language-option';

import { useLanguageOptions } from './use-language-options';

afterEach(cleanup);

/** A bare picker offering what the hook answers, as a language picker does. */
function Picker(source: LanguageOptionSource & { value: string }): ReactNode {
  const options = useLanguageOptions(source);
  return (
    <select aria-label="Language" value={source.value} onChange={() => undefined}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const offered = (): string[] => screen.queryAllByRole('option').map((option) => (option as HTMLOptionElement).value);

describe('useLanguageOptions', () => {
  it('offers the explicit options over the kind data', () => {
    render(<Picker kind="code" options={[{ value: 'x', label: 'Custom X' }]} value="x" />);

    expect(screen.getByRole('option', { name: 'Custom X' })).toBeTruthy();
    expect(offered()).toEqual(['x']);
  });

  it('offers the given locales for the default kind', () => {
    render(<Picker locales={['en', 'vi']} value="en" />);

    expect(offered()).toEqual(['en', 'vi']);
  });

  it('offers only the current value when no locales are given, and nothing for an empty value', () => {
    const { rerender } = render(<Picker value="en" />);
    expect(offered()).toEqual(['en']);

    rerender(<Picker value="" />);
    expect(offered()).toEqual([]);
  });
});
