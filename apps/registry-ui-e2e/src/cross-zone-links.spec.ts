import { test } from './test/fixtures';
import { expectDocumentLoadsAcrossZones } from './test/cross-zone-links';

/** Whether `pathname` is one of the web zone's pages, `/native` and under it being the native zone's. */
function isWeb(pathname: string): boolean {
  return pathname !== '/native' && !pathname.startsWith('/native/');
}

test('cross-zone links are plain anchors', async ({ page }) => {
  for (const start of ['/', '/docs']) {
    await expectDocumentLoadsAcrossZones(page, start, isWeb);
  }
});
