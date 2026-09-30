import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { createSearchAPI } from 'fumadocs-core/search/server';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandMenu } from './command-menu';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => undefined }) }));

const tree: Root = { name: 'Docs', children: [{ type: 'page', name: 'Introduction', url: '/docs' }] };

/** The search index `/api/search` exports at build, here built from one page by the same library. */
const searchAPI = createSearchAPI('advanced', {
  indexes: [
    {
      id: '/docs/components/status-indicator',
      title: 'Status Indicator',
      description: 'A dot and a label for a status.',
      url: '/docs/components/status-indicator',
      structuredData: { headings: [], contents: [] },
    },
  ],
});

const server = setupServer(http.get('/api/search', () => searchAPI.staticGET()));

// jsdom has no ResizeObserver; the command list measures its height with one.
class FakeResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  // jsdom does not scroll; the command list scrolls the selected item into view.
  Element.prototype.scrollIntoView = () => undefined;
  server.listen({ onUnhandledFrame: 'error' });
});
beforeEach(() => vi.stubGlobal('ResizeObserver', FakeResizeObserver));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

describe('CommandMenu', () => {
  it('opens on Ctrl+K and lists the pages the search index finds', async () => {
    render(<CommandMenu tree={tree} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'status' } });

    expect(await screen.findByRole('option', { name: 'Status Indicator' })).toBeTruthy();
  });

  it('opens from an icon-only trigger, for a header too narrow for the full search button', async () => {
    render(<CommandMenu tree={tree} />);

    fireEvent.click(screen.getByRole('button', { name: 'Search docs' }));

    expect(await screen.findByRole('combobox')).toBeTruthy();
  });

  it('shows the Cmd shortcut hint once mounted on macOS', async () => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Macintosh; Intel Mac OS X 10_15_7' });

    render(<CommandMenu tree={tree} />);

    expect(await screen.findByText('Cmd')).toBeTruthy();
    expect(screen.queryByText('Ctrl')).toBeNull();
  });
});
