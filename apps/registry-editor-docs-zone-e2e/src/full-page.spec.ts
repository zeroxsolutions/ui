import { expect, test } from './test/fixtures';

test("a preview's full page button opens its demo alone, with no site chrome", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto('/docs/editor/document-editor');

  const open = page.getByRole('link', { name: 'Open in a new tab' }).first();
  await expect(open).toHaveAttribute('href', '/docs/editor/view/document-editor-demo');
  await expect(open).toHaveAttribute('target', '_blank');

  const [view] = await Promise.all([context.waitForEvent('page'), open.click()]);
  await view.waitForLoadState();
  await expect(view).toHaveURL(/\/docs\/editor\/view\/document-editor-demo$/);
  await expect(view.locator('[data-editor=document] [contenteditable=true]')).toBeVisible();
  await expect(view.getByRole('navigation', { name: 'Docs' })).toHaveCount(0);
});

test('serves no view page for a name that is not an editor demo', async ({ request }) => {
  expect((await request.get('/docs/editor/view/document-editor')).status()).toBe(404);
  expect((await request.get('/docs/editor/view/button-demo')).status()).toBe(404);
});
