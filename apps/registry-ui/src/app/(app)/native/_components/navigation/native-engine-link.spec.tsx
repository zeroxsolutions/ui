import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { NativeEngineLink } from './native-engine-link';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('NativeEngineLink', () => {
  it('moves a native component link to the engine the reader last read', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');

    render(<NativeEngineLink href="/native/components/nativewind/button">Button</NativeEngineLink>);

    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('href')).toBe('/native/components/uniwind/button');
  });

  it('keeps the default engine for a reader who has read none, and leaves a docs link as it is', () => {
    render(
      <>
        <NativeEngineLink href="/native/components/nativewind">Components</NativeEngineLink>
        <NativeEngineLink href="/native/docs/installation">Get started</NativeEngineLink>
      </>,
    );

    expect(screen.getByRole('link', { name: 'Components' }).getAttribute('href')).toBe('/native/components/nativewind');
    expect(screen.getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe('/native/docs/installation');
  });
});
