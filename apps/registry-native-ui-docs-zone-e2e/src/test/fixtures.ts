import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

import { test as base } from '@playwright/test';

// The artwork a page asks the CDN for is served from the package itself, so no spec reaches a server it
// does not control or waits on the CDN having been uploaded.
const assets = resolve(dirname(require.resolve('@zeroxsolutions/icons/package.json')), 'dist/assets/brands');

// On the context, so every page a spec opens is covered, and automatic, so a spec that visits a page
// drawing a brand mark later needs no call of its own.
export const test = base.extend<{ brandArtwork: void }>({
  brandArtwork: [
    async ({ context }, use) => {
      await context.route('https://icons.zeroxsolutions.com/brands/**', (route) => {
        const file = resolve(assets, new URL(route.request().url()).pathname.replace(/^\/brands\//, ''));
        if (!file.startsWith(assets + sep)) return route.fulfill({ status: 404 });
        try {
          // The CDN's own CORS header: a mask-image is fetched in CORS mode and is dropped without it.
          return route.fulfill({
            contentType: 'image/svg+xml',
            headers: { 'access-control-allow-origin': '*' },
            body: readFileSync(file),
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return route.fulfill({ status: 404 });
          throw error;
        }
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
