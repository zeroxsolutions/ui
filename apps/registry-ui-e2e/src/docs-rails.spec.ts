import { expect, test } from '@playwright/test';

test('at the end of a docs page the sidebar stops above the footer and neither rail chains its scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/installation');

  const sidebar = page.getByRole('navigation', { name: 'Docs' });
  const footer = page.getByRole('contentinfo');
  await page.keyboard.press('End');
  await expect(footer).toBeInViewport();

  await expect
    .poll(async () => {
      const [rail, foot] = await Promise.all([sidebar.boundingBox(), footer.boundingBox()]);
      return rail !== null && foot !== null && rail.y + rail.height <= foot.y;
    })
    .toBe(true);
  // A rail as tall as the viewport meets the footer and is shoved up under the header by the footer's height.
  await expect
    .poll(async () => {
      const [rail, header] = await Promise.all([sidebar.boundingBox(), page.getByRole('banner').boundingBox()]);
      return rail !== null && header !== null && rail.y >= header.y + header.height;
    })
    .toBe(true);

  for (const rail of [sidebar, page.getByRole('navigation', { name: 'On this page' })]) {
    await expect(rail).toHaveCSS('overscroll-behavior-y', 'none');
  }
});
