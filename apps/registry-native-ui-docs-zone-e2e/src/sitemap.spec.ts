import { expect, test } from './test/fixtures';
import { componentPageSlugs } from './test/native-pages';

const HOST = 'https://ui.zeroxsolutions.com';

test('/native/sitemap.xml lists each native page once, a component under NativeWind only', async ({ request }) => {
  const response = await request.get('/native/sitemap.xml');
  expect(response.status()).toBe(200);

  const sitemap = await response.text();
  expect(sitemap).toContain(`<loc>${HOST}/native</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/docs</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/docs/installation</loc>`);
  expect(sitemap).toContain(`<loc>${HOST}/native/components/nativewind</loc>`);
  // A Uniwind page names its NativeWind twin as canonical, so listing it would list one page twice.
  expect(sitemap).not.toContain('/native/components/uniwind');
  expect(sitemap).not.toContain('/docs/native');
});

test('/native/sitemap.xml lists every native component page at its NativeWind URL', async ({ request }) => {
  const sitemap = await (await request.get('/native/sitemap.xml')).text();

  for (const slug of componentPageSlugs) {
    expect(sitemap, slug).toContain(`<loc>${HOST}/native/components/nativewind/${slug}</loc>`);
  }
});

test('/native/sitemap.xml lists the icons page of each engine', async ({ request }) => {
  const sitemap = await (await request.get('/native/sitemap.xml')).text();

  for (const engine of ['nativewind', 'uniwind']) {
    expect(sitemap, engine).toContain(`<loc>${HOST}/native/icons/${engine}</loc>`);
  }
});
