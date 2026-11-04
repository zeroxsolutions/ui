import { expect, test } from './test/fixtures';

test("the web installation's init command and components.json follow the web style picked", async ({ page }) => {
  await page.goto('/docs/installation?style=rhea');

  await expect(page.getByText('pnpm dlx shadcn@latest init --base base --preset rhea')).toBeVisible();
  // The highlighter splits the JSON into one span per token, so the line is matched by its text.
  await expect(page.getByRole('main')).toContainText('"style": "base-rhea"');
  await expect(page.getByRole('main')).toContainText(
    '"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"',
  );
});
