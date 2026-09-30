import { act, cleanup, render, screen } from '@testing-library/react';
import type { TableOfContents } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsToc } from './docs-toc';

const toc: TableOfContents = [
  { title: 'Installation', url: '#installation', depth: 2 },
  { title: 'Usage', url: '#usage', depth: 2 },
];

/** The callback the TOC handed the last observer it made; a case calls it to scroll a heading into view. */
let reportIntersections: (entries: IntersectionObserverEntry[]) => void = () => undefined;

// jsdom has no IntersectionObserver, and nothing in it scrolls; this one reports what a case says.
class FakeIntersectionObserver {
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    reportIntersections = callback;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** What an observer reports for the heading with `id` as it scrolls into or out of view. */
function intersection(id: string, isIntersecting: boolean): IntersectionObserverEntry {
  const target = document.getElementById(id);
  if (!target) throw new Error(`no heading #${id} in the document`);
  const rect = target.getBoundingClientRect();
  return {
    target,
    isIntersecting,
    rootBounds: null,
    boundingClientRect: rect,
    intersectionRect: rect,
    intersectionRatio: isIntersecting ? 1 : 0,
    time: 0,
  };
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Renders `ui` and lets the anchor provider's effects run before a case asserts. */
async function renderSettled(ui: ReactNode): Promise<void> {
  await act(async () => {
    render(ui);
  });
}

describe('DocsToc', () => {
  it('marks the heading in view, and moves the mark as another scrolls in', async () => {
    await renderSettled(
      <>
        <h2 id="installation">Installation</h2>
        <h2 id="usage">Usage</h2>
        <DocsToc toc={toc} />
      </>,
    );

    act(() => reportIntersections([intersection('installation', true), intersection('usage', false)]));

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('location');
    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBeNull();

    act(() => reportIntersections([intersection('installation', false), intersection('usage', true)]));

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBe('location');
  });

  it('titles its list On this page', async () => {
    await renderSettled(<DocsToc toc={toc} />);

    expect(screen.getByText('On this page')).toBeTruthy();
  });

  it('renders nothing for a page without headings', async () => {
    const { container } = render(<DocsToc toc={[]} />);

    expect(container.childElementCount).toBe(0);
  });
});
