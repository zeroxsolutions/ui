import type { Root } from 'fumadocs-core/page-tree';
import { createSearchAPI } from 'fumadocs-core/search/server';
import { http } from 'msw';
import { setupWorker } from 'msw/browser';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TestHost } from '../../../test/test-host';

import { DocsSearch } from './docs-search';

const push = vi.fn<(href: string) => void>();

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Status Indicator', url: '/docs/components/status-indicator' },
  ],
};

/** The search index `/api/search` exports at build, here built from a web page and a native one by the same library. */
const searchAPI = createSearchAPI('advanced', {
  indexes: [
    {
      id: '/docs/components/status-indicator',
      title: 'Status Indicator',
      description: 'A dot and a label for a status.',
      url: '/docs/components/status-indicator',
      tag: 'web',
      structuredData: {
        headings: [],
        contents: [{ heading: undefined, content: 'It sets `data-slot` on its root element.' }],
      },
    },
    {
      id: '/native/components/nativewind/label',
      title: 'Label',
      url: '/native/components/nativewind/label',
      tag: 'native',
      structuredData: {
        headings: [],
        contents: [{ heading: undefined, content: 'Give the field the label nativeID in aria-labelledby.' }],
      },
    },
  ],
});

/** The index the editor zone exports at `/docs/editor/api/search`; it also lists the status indicator page, at the web index's url and id but with other text. */
const editorSearchAPI = createSearchAPI('advanced', {
  indexes: [
    {
      id: '/docs/editor/document-editor',
      title: 'Document Editor',
      url: '/docs/editor/document-editor',
      tag: 'web',
      structuredData: {
        headings: [],
        contents: [{ heading: undefined, content: 'The toolbar groups every formatting command.' }],
      },
    },
    {
      id: '/docs/components/status-indicator',
      title: 'Status Indicator',
      description: 'A dot and a label for a status.',
      url: '/docs/components/status-indicator',
      tag: 'web',
      structuredData: {
        headings: [],
        contents: [{ heading: undefined, content: 'Its status dot carries the slot.' }],
      },
    },
    {
      id: '/docs/editor/status-bar',
      title: 'Status Bar',
      url: '/docs/editor/status-bar',
      tag: 'web',
      structuredData: {
        headings: [],
        contents: [{ heading: undefined, content: 'The status dot sits in the bar.' }],
      },
    },
  ],
});

// The editor's path ends as the web index's does, so its handler comes first.
const worker = setupWorker(
  http.get('*/docs/editor/api/search', () => editorSearchAPI.staticGET()),
  http.get('*/api/search', () => searchAPI.staticGET()),
);

/** A client fetches each index once, so each case reads its indexes from paths no earlier case read. */
let run = 0;
const index = (path: string): string => `/run-${run}${path}`;

function search(props: Partial<Parameters<typeof DocsSearch>[0]> = {}, children?: ReactNode) {
  return render(
    <TestHost push={push}>
      {children}
      <DocsSearch tree={tree} api={index('/api/search')} {...props} />
    </TestHost>,
  );
}

const field = () => page.getByRole('combobox');
const openMenu = () => userEvent.keyboard('{Control>}k{/Control}');

beforeAll(async () => {
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' });
});
afterEach(() => {
  worker.resetHandlers();
  push.mockClear();
  run += 1;
});
afterAll(() => worker.stop());

describe('DocsSearch', () => {
  it('opens on Ctrl+K and lists a page its title matches once, not again among the search results', async () => {
    await search();

    await openMenu();
    await userEvent.fill(field(), 'status root element');
    await expect.element(page.getByRole('option', { name: /on its root element/ })).toBeVisible();
    await userEvent.fill(field(), 'status');

    await expect.poll(() => page.getByRole('option', { name: 'Status Indicator' }).all()).toHaveLength(1);
  });

  it('opens on / outside a field, and leaves / to a field that has focus', async () => {
    await search({}, <input aria-label="Other field" />);

    await userEvent.click(page.getByRole('textbox', { name: 'Other field' }));
    await userEvent.keyboard('/');
    await expect.element(page.getByRole('textbox', { name: 'Other field' })).toHaveValue('/');
    await expect.element(field()).not.toBeInTheDocument();

    await userEvent.click(document.body);
    await userEvent.keyboard('/');
    await expect.element(field()).toBeVisible();
  });

  it("lists the site's sections and the docs' pages before a query", async () => {
    await search({ navItems: [{ href: '/blocks', label: 'Blocks', pattern: '/blocks' }] });

    await openMenu();

    await expect.element(page.getByRole('option', { name: 'Blocks' })).toBeVisible();
    await expect.element(page.getByRole('option', { name: 'Introduction' })).toBeVisible();
  });

  it('drops the last query when it closes, so a reopened menu lists no stale results', async () => {
    await search();
    await openMenu();
    await userEvent.fill(field(), 'root element');
    await expect.element(page.getByRole('option', { name: /on its root element/ })).toBeVisible();

    await openMenu();
    await expect.element(field()).not.toBeInTheDocument();
    await openMenu();

    await expect.element(page.getByRole('option', { name: 'Introduction' })).toBeVisible();
    await expect.element(page.getByRole('option', { name: /on its root element/ })).not.toBeInTheDocument();
  });

  it('shows a search result as its text, without the Markdown backticks the index keeps', async () => {
    await search();

    await openMenu();
    await userEvent.fill(field(), 'root element');

    await expect
      .element(page.getByRole('option', { name: /on its root element/ }))
      .toHaveTextContent('It sets data-slot on its root element.');
  });

  it("searches only its own platform's pages", async () => {
    await search();

    await openMenu();
    await userEvent.fill(field(), 'root element');
    await expect.element(page.getByRole('option', { name: /on its root element/ })).toBeVisible();
    await userEvent.fill(field(), 'nativeID labelledby');

    await expect.element(page.getByRole('group', { name: 'Search results' })).not.toBeInTheDocument();
  });

  it('opens a result where resultHref moves it, not where the index lists it', async () => {
    await search({ platform: 'native', resultHref: (url) => url.replace('/nativewind/', '/uniwind/') });

    await openMenu();
    await userEvent.fill(field(), 'nativeID labelledby');
    await userEvent.click(page.getByRole('option', { name: /label nativeID/ }));

    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/native\/components\/uniwind\/label(#.*)?$/));
  });

  it('finds pages from every index', async () => {
    await search({ api: [index('/api/search'), index('/docs/editor/api/search')] });

    await openMenu();
    await userEvent.fill(field(), 'toolbar formatting command');
    await userEvent.click(page.getByRole('option', { name: /toolbar groups/ }));

    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/docs\/editor\/document-editor(#.*)?$/));
  });

  it('shows a page both indexes hold once, from the first index', async () => {
    await search({ api: [index('/api/search'), index('/docs/editor/api/search')] });

    await openMenu();
    await userEvent.fill(field(), 'status dot');

    // The status bar page answers in the same search as the second index's copy of the shared page.
    await expect.element(page.getByRole('option', { name: /status dot sits/ })).toBeVisible();
    await expect.element(page.getByRole('option', { name: /dot carries the slot/ })).not.toBeInTheDocument();
  });

  it('keeps the pages of the indexes that answer when another fails', async () => {
    worker.use(http.get('*/api/broken-search', () => new Response(null, { status: 500 })));
    await search({ api: [index('/api/search'), index('/api/broken-search')] });

    await openMenu();
    await userEvent.fill(field(), 'root element');

    await expect.element(page.getByRole('option', { name: /on its root element/ })).toBeVisible();
  });
});

describe('DocsSearch at each width', () => {
  const trigger = () => page.getByRole('button', { name: 'Search documentation' });
  const userAgent = navigator.userAgent;
  const asOn = (system: string) => cdp().send('Emulation.setUserAgentOverride', { userAgent: system });

  afterEach(async () => {
    await page.viewport(414, 896);
    await asOn(userAgent);
  });

  it('opens from its one icon-only trigger in a narrow header', async () => {
    await page.viewport(375, 800);
    await search();

    await expect.poll(() => trigger().all()).toHaveLength(1);
    await expect.element(trigger()).not.toHaveTextContent('Ctrl');
    await userEvent.click(trigger());

    await expect.element(field()).toBeVisible();
  });

  it('opens from its one full search button, with the shortcut hint, in a wide header', async () => {
    await asOn('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.viewport(1280, 800);
    await search();

    await expect.poll(() => trigger().all()).toHaveLength(1);
    await expect.element(trigger()).toHaveTextContent('Ctrl');
    await userEvent.click(trigger());

    await expect.element(field()).toBeVisible();
  });

  it('shows the command key glyph in the shortcut hint on macOS', async () => {
    await asOn('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    await page.viewport(1280, 800);
    await search();

    await expect.element(trigger()).toHaveTextContent('⌘');
    await expect.element(trigger()).not.toHaveTextContent('Ctrl');
  });
});
