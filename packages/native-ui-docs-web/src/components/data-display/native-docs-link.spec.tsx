import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { NativeDocsLink } from './native-docs-link';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('NativeDocsLink', () => {
  it('links a component page under the default engine when none is remembered', () => {
    render(<NativeDocsLink href="/native/components/nativewind/theme">Theme</NativeDocsLink>);

    expect(screen.getByRole('link', { name: 'Theme' }).getAttribute('href')).toBe(
      '/native/components/nativewind/theme',
    );
  });

  it('moves a component page link to the remembered engine', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');
    render(<NativeDocsLink href="/native/components/nativewind/theme">Theme</NativeDocsLink>);

    expect(screen.getByRole('link', { name: 'Theme' }).getAttribute('href')).toBe('/native/components/uniwind/theme');
  });
});
