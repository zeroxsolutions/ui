import { expect, test } from './test/fixtures';

const HOST = 'https://ui.zeroxsolutions.com';

test("/sitemap.xml is an index naming the web's sitemap and the native zone's", async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const index = await response.text();
  expect(index).toContain('<sitemapindex');
  expect(index).toContain(`<loc>${HOST}/docs-sitemap.xml</loc>`);
  expect(index).toContain(`<loc>${HOST}/native/sitemap.xml</loc>`);
});

test('/docs-sitemap.xml lists the web pages at the registry host, and no native one', async ({ request }) => {
  const response = await request.get('/docs-sitemap.xml');
  expect(response.status()).toBe(200);

  const sitemap = await response.text();
  expect(sitemap).toContain(`<loc>${HOST}/</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/docs/components/base/status-indicator</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/blocks/base</loc>`);
  expect(sitemap).not.toContain('/native');
});
