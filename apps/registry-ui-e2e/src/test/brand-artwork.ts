import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { Page } from '@playwright/test';

// The artwork a page asks the CDN for is served from the package itself, so a suite neither reaches
// a server it does not control nor waits on the CDN having been uploaded.
const assets = resolve(dirname(require.resolve('@zeroxsolutions/icons/package.json')), 'dist/assets/brands');

export async function serveBrandArtwork(page: Page): Promise<void> {
  await page.route('https://icons.zeroxsolutions.com/brands/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/brands\//, '');
    return route.fulfill({ contentType: 'image/svg+xml', body: readFileSync(resolve(assets, path)) });
  });
}
