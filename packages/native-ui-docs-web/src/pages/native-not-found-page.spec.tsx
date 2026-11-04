import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { NativeNotFoundPage } from './native-not-found-page';

const PAGES = [
  { title: 'Components', url: '/native/components/nativewind' },
  { title: 'Button', url: '/native/components/nativewind/button' },
];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderAt(pathname: string): HTMLElement {
  render(<NativeNotFoundPage section="Components" pages={PAGES} />, {
    wrapper: ({ children }: { children: ReactNode }) => <TestHost pathname={pathname}>{children}</TestHost>,
  });
  return screen.getByRole('region', { name: 'Components' });
}

describe('NativeNotFoundPage', () => {
  it('lists the section under the engine the missing path names, over the one last read', () => {
    localStorage.setItem('zui:native-engine', 'nativewind');

    const section = renderAt('/native/components/uniwind/copy-button');

    expect(within(section).getByRole('link', { name: 'Button' }).getAttribute('href')).toBe(
      '/native/components/uniwind/button',
    );
    expect(within(section).getByRole('link', { name: 'Components' }).getAttribute('href')).toBe(
      '/native/components/uniwind',
    );
  });

  it('lists the section under the engine last read where the path names none', () => {
    localStorage.setItem('zui:native-engine', 'uniwind');

    const section = renderAt('/native/components/foo/button');

    expect(within(section).getByRole('link', { name: 'Button' }).getAttribute('href')).toBe(
      '/native/components/uniwind/button',
    );
  });
});
