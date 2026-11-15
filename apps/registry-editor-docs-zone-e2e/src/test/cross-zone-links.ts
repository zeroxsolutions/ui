import { type Page, type Request } from '@playwright/test';

import { expect } from './fixtures';
import { waitForHydration } from './hydrated';

/** The same-origin hrefs of the links shown on `page` whose pathname `isOwn` refuses, each once. */
async function otherZoneHrefs(page: Page, isOwn: (pathname: string) => boolean): Promise<string[]> {
  const links = await page.getByRole('link').filter({ visible: true }).all();
  const hrefs = await Promise.all(links.map(async (link) => (await link.getAttribute('href')) ?? ''));
  const local = hrefs.filter((href) => href.startsWith('/') && !href.startsWith('//'));
  return [...new Set(local)].filter((href) => !isOwn(new URL(href, page.url()).pathname));
}

/**
 * Opens `start` once per link on it into the other zone, and checks that following the link loads its page
 * as a new document and that nothing fetched that page before, as the framework's link does when it
 * prefetches or navigates on the client. Fails when `start` shows no such link.
 */
export async function expectDocumentLoadsAcrossZones(
  page: Page,
  start: string,
  isOwn: (pathname: string) => boolean,
): Promise<void> {
  await page.goto(start);
  const hrefs = await otherZoneHrefs(page, isOwn);
  expect(hrefs, `${start} links into the other zone`).not.toEqual([]);

  for (const href of hrefs) {
    const target = new URL(href, page.url());
    const isTarget = (request: Request): boolean => {
      const url = new URL(request.url());
      return url.origin === target.origin && url.pathname === target.pathname;
    };
    const isDocumentLoad = (request: Request): boolean =>
      isTarget(request) && request.isNavigationRequest() && request.frame() === page.mainFrame();
    // Only what is asked for before the document load: the loaded page may fetch its own path again.
    const requested: Request[] = [];
    let loading = false;
    const record = (request: Request): void => {
      if (isDocumentLoad(request)) loading = true;
      else if (!loading && isTarget(request)) requested.push(request);
    };
    page.on('request', record);
    await page.goto(start);
    // The framework's link prefetches and takes over clicks only once the page has hydrated.
    await waitForHydration(page);

    const navigation = page.waitForRequest(isDocumentLoad, { timeout: 10_000 });
    await page
      .getByRole('link')
      .filter({ visible: true })
      .and(page.locator(`[href="${href}"]`))
      .first()
      .click();
    const document = await navigation;
    await page.waitForURL(target.href);
    page.off('request', record);

    expect(document.resourceType(), `${start} -> ${href}`).toBe('document');
    expect(
      requested.map((request) => request.url()),
      `${start} -> ${href} fetched before the document load`,
    ).toEqual([]);
  }
}
