import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { createSearchAPI } from 'fumadocs-core/search/server';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DocsSearch } from './docs-search';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => undefined }) }));

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Status Indicator', url: '/docs/components/status-indicator' },
  ],
};

/** The search index `/api/search` exports at build, here built from one page by the same library. */
const searchAPI = createSearchAPI('advanced', {
  indexes: [
    {
      id: '/docs/components/status-indicator',
      title: 'Status Indicator',
      description: 'A dot and a label for a status.',
      url: '/docs/components/status-indicator',
      structuredData: {
        headings: [],
        contents: [{ heading: undefined, content: 'It sets `data-slot` on its root element.' }],
      },
    },
  ],
});

const server = setupServer(http.get('/api/search', () => searchAPI.staticGET()));

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

describe('DocsSearch', () => {
  it('opens on Ctrl+K and lists a page its title matches once, not again among the search results', async () => {
    render(<DocsSearch tree={tree} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'status' } });
    // The index has answered once a text hit shows; its page hit for the same title is dropped.
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'status root element' } });
    await screen.findByRole('option', { name: /on its root element/ }, { timeout: 3_000 });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'status' } });

    await waitFor(() => expect(screen.getAllByRole('option', { name: 'Status Indicator' })).toHaveLength(1));
  });

  it('opens on / outside a field, and leaves / to a field that has focus', async () => {
    render(
      <>
        <input aria-label="Other field" />
        <DocsSearch tree={tree} />
      </>,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Other field' }), { key: '/' });
    expect(screen.queryByRole('combobox')).toBeNull();

    fireEvent.keyDown(document.body, { key: '/' });
    expect(await screen.findByRole('combobox')).toBeTruthy();
  });

  it("lists the site's sections and the docs' pages before a query", async () => {
    render(<DocsSearch tree={tree} navItems={[{ href: '/blocks', label: 'Blocks' }]} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(await screen.findByRole('option', { name: 'Blocks' })).toBeTruthy();
    expect(await screen.findByRole('option', { name: 'Introduction' })).toBeTruthy();
  });

  it('drops the last query when it closes, so a reopened menu lists no stale results', async () => {
    render(<DocsSearch tree={tree} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'root element' } });
    await screen.findByRole('option', { name: /on its root element/ }, { timeout: 3_000 });

    // Focus sits in the menu's input, where a browser would take Ctrl+K itself, so the chord is sent there.
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'k', ctrlKey: true });
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull());
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(await screen.findByRole('option', { name: 'Introduction' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /on its root element/ })).toBeNull();
  });

  it('opens from an icon-only trigger, for a header too narrow for the full search button', async () => {
    render(<DocsSearch tree={tree} />);

    // The header draws one trigger per width: the full button first, the icon-only one after it.
    fireEvent.click(screen.getAllByRole('button', { name: 'Search documentation' })[1]);

    expect(await screen.findByRole('combobox')).toBeTruthy();
  });

  it('shows a search result as its text, without the Markdown backticks the index keeps', async () => {
    render(<DocsSearch tree={tree} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'root element' } });

    const result = await screen.findByRole('option', { name: /on its root element/ }, { timeout: 3_000 });
    expect(result.textContent).toBe('It sets data-slot on its root element.');
  });

  it('names the search button once, whichever of its labels and shortcut hint are drawn', () => {
    render(<DocsSearch tree={tree} />);

    expect(screen.getAllByRole('button', { name: 'Search documentation' })).toHaveLength(2);
  });

  it('shows the command key glyph in the shortcut hint once mounted on macOS', async () => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Macintosh; Intel Mac OS X 10_15_7' });

    render(<DocsSearch tree={tree} />);

    expect(await screen.findByText('\u2318')).toBeTruthy();
    expect(screen.queryByText('Ctrl')).toBeNull();
  });
});
