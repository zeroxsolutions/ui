import { expect, test } from './test/fixtures';

test('the native pages from before /native answer 301 with their new address, the query kept', async ({ request }) => {
  for (const [old, location] of [
    ['/docs/native', '/native/docs'],
    ['/docs/native/installation', '/native/docs/installation'],
    ['/docs/native/button', '/native/components/nativewind/button'],
    ['/docs/native/tab-bar?style=nova', '/native/components/nativewind/tab-bar?style=nova'],
  ]) {
    const response = await request.get(old, { maxRedirects: 0 });

    expect(response.status(), old).toBe(301);
    expect(response.headers()['location'], old).toBe(location);
  }
});

test('an engine outside the set is a 404, not a page with broken snippets', async ({ request }) => {
  for (const path of ['/native/components/foo/button', '/native/components/foo', '/native/blocks/foo']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("a component page under Uniwind names Uniwind's registry style and links its sidebar under Uniwind", async ({
  page,
}) => {
  await page.goto('/native/components/uniwind/button');

  await expect(page.getByRole('heading', { level: 1, name: 'Button', exact: true })).toBeVisible();
  await expect(page.getByText('pnpm dlx shadcn@latest add @zui/button')).toBeVisible();
  await page.getByRole('tab', { name: 'URL' }).click();
  await expect(
    page.getByText('pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/styles/uniwind-vega/button.json'),
  ).toBeVisible();
  const sidebar = page.getByRole('navigation', { name: 'Docs' });
  await expect(sidebar.getByRole('link', { name: 'Text', exact: true })).toHaveAttribute(
    'href',
    '/native/components/uniwind/text',
  );
  // A link in the page's own text moves to the page's engine too.
  await expect(page.getByRole('main').getByRole('link', { name: 'Icon', exact: true }).first()).toHaveAttribute(
    'href',
    '/native/components/uniwind/icon',
  );
});

test("the theme page under an engine shows only that engine's setup", async ({ page }) => {
  await page.goto('/native/components/uniwind/theme');

  await expect(page.getByText('global.css gains @import "./zui-theme.css";.')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'NativeWind' })).toHaveCount(0);
  await expect(page.getByText('tailwind.config.js', { exact: false })).toHaveCount(0);
});

test('the native blocks page says there are none yet', async ({ page }) => {
  await page.goto('/native/blocks/nativewind');

  await expect(page.getByRole('heading', { level: 1, name: 'Blocks' })).toBeVisible();
  await expect(page.getByText('No native blocks yet')).toBeVisible();
});
