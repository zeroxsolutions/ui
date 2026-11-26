import { expect, test } from './test/fixtures';

test('/view serves no page for a component, which is neither a block nor a demo', async ({ page }) => {
  const response = await page.goto('/view/ai-provider-picker');

  expect(response?.status()).toBe(404);
});

test('/view serves no page for an editor demo, which the editor zone serves', async ({ request }) => {
  expect((await request.get('/view/document-editor-demo')).status()).toBe(404);
});

test("a component preview's full page button opens its demo alone", async ({ page, context, request }) => {
  await page.goto('/docs/components/base/ai-provider-picker');

  const open = page.getByRole('link', { name: 'Open ai-provider-picker-demo in a new tab' }).first();
  await expect(open).toHaveAttribute('href', '/view/ai-provider-picker-demo');
  await expect(open).toHaveAttribute('target', '_blank');

  const [view] = await Promise.all([context.waitForEvent('page'), open.click()]);
  await view.waitForLoadState();
  await expect(view).toHaveURL(/\/view\/ai-provider-picker-demo$/);
  await expect(view.getByRole('navigation', { name: 'Docs' })).toHaveCount(0);
  // The 404 page has no Docs navigation either, so the page's status and title are what tell them apart.
  expect((await request.get('/view/ai-provider-picker-demo')).status()).toBe(200);
  await expect(view).toHaveTitle(/^AI Provider Picker demo/);
});
