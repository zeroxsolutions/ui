import { editorItems } from './test/editor-items';
import { expect, test } from './test/fixtures';
import { expectDocumentLoadsAcrossZones } from './test/cross-zone-links';
import { waitForHydration } from './test/hydrated';

for (const path of ['/docs/editor', '/docs/editor/document-editor']) {
  test(`${path} loads every asset under its prefix`, async ({ page, baseURL }) => {
    // The editor's own chunks make this page the slowest to hydrate, WebKit most of all.
    test.setTimeout(90_000);
    const origin = new URL(baseURL ?? '').origin;
    const own = (url: string): URL | undefined => {
      const parsed = new URL(url);
      return parsed.origin === origin ? parsed : undefined;
    };
    const failed: string[] = [];
    const chunks: string[] = [];
    page.on('requestfailed', (request) => {
      if (own(request.url())) failed.push(`${request.url()} ${request.failure()?.errorText}`);
    });
    page.on('response', (response) => {
      if (own(response.url()) && response.status() >= 400) failed.push(`${response.url()} ${response.status()}`);
    });
    page.on('request', (request) => {
      const url = own(request.url());
      if (url?.pathname.includes('/_next/')) chunks.push(url.pathname);
    });

    await page.goto(path);
    // Hydrated, the page has run its chunks and its links have asked for what they prefetch.
    await waitForHydration(page);

    expect(failed).toEqual([]);
    expect(chunks).not.toEqual([]);
    // The other zones answer `/_next/*` on the same host, so a chunk outside the prefix is theirs.
    expect(chunks.filter((chunk) => !chunk.startsWith('/editor-static/_next/'))).toEqual([]);
  });
}

/** Whether `pathname` is one of this zone's pages, the rest of the host being another zone's. */
function isEditor(pathname: string): boolean {
  return pathname === '/docs/editor' || pathname.startsWith('/docs/editor/');
}

test('links out of the zone with plain anchors', async ({ page }) => {
  // Each link is one reload of a hydrating page, and the sidebar and header carry a dozen of them.
  test.setTimeout(180_000);
  for (const start of ['/docs/editor', '/docs/editor/document-editor']) {
    await expectDocumentLoadsAcrossZones(page, start, isEditor);
  }
});

test("answers the editor pages' markdown, image, sitemap and llms", async ({ request }) => {
  for (const [path, type] of [
    ['/docs/editor.md', 'text/markdown'],
    ['/docs/editor/document-editor.md', 'text/markdown'],
    ['/og/docs/editor/document-editor/image.png', 'image/png'],
    ['/docs/editor/sitemap.xml', 'xml'],
    ['/docs/editor/llms.txt', 'text/plain'],
    ['/docs/editor/llms-full.txt', 'text/plain'],
  ]) {
    const response = await request.get(path);

    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain(type);
  }
});

test('the sitemap lists every editor page', async ({ request }) => {
  const sitemap = await (await request.get('/docs/editor/sitemap.xml')).text();

  for (const path of ['/docs/editor', ...editorItems.map(({ name }) => `/docs/editor/${name}`)]) {
    expect(sitemap, path).toContain(`<loc>https://ui.zeroxsolutions.com${path}</loc>`);
  }
});

test("the header's Icons entry links the web icons page, after Blocks", async ({ page }) => {
  await page.goto('/docs/editor');
  const header = page.getByRole('navigation', { name: 'Main' });

  await expect(header.getByRole('link', { name: 'Icons', exact: true })).toHaveAttribute('href', '/icons/base');
  await expect(header.getByRole('link')).toHaveText(['Docs', 'Components', 'Blocks', 'Icons', 'Editor']);
});
