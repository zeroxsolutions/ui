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

  it('leaves a link to anywhere else as written', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');
    render(<NativeDocsLink href="https://docs.uniwind.dev/quickstart">Guide</NativeDocsLink>);

    expect(screen.getByRole('link', { name: 'Guide' }).getAttribute('href')).toBe(
      'https://docs.uniwind.dev/quickstart',
    );
  });
});
