import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

for (const path of ['/native', '/native/docs/installation', '/native/components/nativewind/button']) {
  test(`${path} loads every asset`, async ({ page, baseURL }) => {
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
    // The web zone answers `/_next/*` on the same host, so a chunk outside the prefix is the web zone's.
    expect(chunks.filter((chunk) => !chunk.startsWith('/native-static/_next/'))).toEqual([]);
  });
}
