import { expect, test } from './test/fixtures';

test('/sitemap.xml lists the pages at the registry host', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const sitemap = await response.text();
  expect(sitemap).toContain('<loc>https://ui.zeroxsolutions.com/docs/components/status-indicator</loc>');
  expect(sitemap).toContain('<loc>https://ui.zeroxsolutions.com/blocks</loc>');
});
