import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

test('a component page previews the item, shows its source, and pages on', async ({ page }) => {
  await page.goto('/docs/components/base/status-indicator');

  await expect(page.getByText('Connecting').first()).toBeVisible();

  const viewCode = page.getByRole('button', { name: 'View code' }).first();
  await waitForHydration(page);
  await viewCode.click();
  await expect(page.getByText('function StatusIndicatorDemo')).toBeVisible();

  // The Command tab is the install section's default: one pnpm command, headed by its language.
  await expect(page.getByRole('tab', { name: 'Command', selected: true })).toBeVisible();
  const install = page.getByRole('tabpanel').filter({ hasText: 'pnpm dlx shadcn@latest add' }).first();
  await expect(install.getByText('bash', { exact: true })).toBeVisible();
  await expect(install.getByRole('tab')).toHaveCount(0);

  // A usage fence is headed by its language.
  await expect(page.getByRole('main').getByText('tsx', { exact: true }).first()).toBeVisible();

  const next = page.getByRole('link', { name: 'Next page' });
  const href = await next.getAttribute('href');
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});
