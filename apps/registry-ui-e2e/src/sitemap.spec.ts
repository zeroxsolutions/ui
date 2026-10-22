import { expect, test } from './test/fixtures';

const HOST = 'https://ui.zeroxsolutions.com';

test('/sitemap.xml lists the pages at the registry host', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const sitemap = await response.text();
  expect(sitemap).toContain(`<loc>${HOST}/docs/components/base/status-indicator</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/blocks/base</loc>`);
});

test('/sitemap.xml lists each native page once, a component under NativeWind only', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();

  expect(sitemap).toContain(`<loc>${HOST}/native</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/docs</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/docs/installation</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/components/nativewind</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/components/nativewind/button</loc>`);
  // A Uniwind page names its NativeWind twin as canonical, so listing it would list one page twice.
  expect(sitemap).not.toContain('/native/components/uniwind');
  expect(sitemap).not.toContain('/docs/native');
});

test('/sitemap.xml lists the later native components at their NativeWind URLs', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();

  for (const name of ['dialog', 'select', 'calendar', 'sonner', 'chart', 'sidebar', 'code-block']) {
    expect(sitemap, name).toContain(`<loc>${HOST}/native/components/nativewind/${name}</loc>`);
  }
});
