import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { NativeEngineLink } from './native-engine-link';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('NativeEngineLink', () => {
  it('moves a native component link to the engine the reader last read', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');

    render(<NativeEngineLink href="/native/components/nativewind/button">Button</NativeEngineLink>, {
      wrapper: TestHost,
    });

    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('href')).toBe('/native/components/uniwind/button');
  });

  it('keeps the default engine for a reader who has read none', () => {
    render(<NativeEngineLink href="/native/components/nativewind">Components</NativeEngineLink>, { wrapper: TestHost });

    expect(screen.getByRole('link', { name: 'Components' }).getAttribute('href')).toBe('/native/components/nativewind');
  });
});
