import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { codeLanguageOptions } from '@/registry/bases/base-ui/lib/language-options';

import { useLanguageOptions } from './use-language-options';

describe('useLanguageOptions', () => {
  it('returns explicit options over the kind data', () => {
    const options = [{ value: 'x', label: 'Custom X' }];
    const { result } = renderHook(() => useLanguageOptions({ kind: 'code', options, value: 'x' }));
    expect(result.current).toBe(options);
  });

  it('offers the code-language set for kind="code"', () => {
    const { result } = renderHook(() => useLanguageOptions({ kind: 'code', value: 'typescript' }));
    expect(result.current).toBe(codeLanguageOptions());
  });

  it('offers the given locales for the default kind', () => {
    const { result } = renderHook(() => useLanguageOptions({ locales: ['en', 'vi'], value: 'en' }));
    expect(result.current.map((o) => o.value)).toEqual(['en', 'vi']);
  });

  it('offers only the current value when no locales are given, and nothing for an empty value', () => {
    const { result, rerender } = renderHook(({ value }) => useLanguageOptions({ value }), {
      initialProps: { value: 'en' },
    });
    expect(result.current.map((o) => o.value)).toEqual(['en']);
    rerender({ value: '' });
    expect(result.current).toEqual([]);
  });
});
