import { test } from './test/fixtures';
import { expectDocumentLoadsAcrossZones } from './test/cross-zone-links';

/** Whether `pathname` is one of this zone's pages, the rest of the host being the web zone's. */
function isNative(pathname: string): boolean {
  return pathname === '/native' || pathname.startsWith('/native/');
}

test('cross-zone links are plain anchors', async ({ page }) => {
  for (const start of ['/native', '/native/blocks/nativewind']) {
    await expectDocumentLoadsAcrossZones(page, start, isNative);
  }
});
