import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

const BUTTON = '/native/components/nativewind/button';

function picker(page: Page): Locator {
  return page.getByRole('button', { name: /^Style/ });
}

/** Picks `style` from the header's picker; the menu opens only once the page has hydrated, so it is clicked until it does. */
async function pickStyle(page: Page, style: string): Promise<void> {
  await expect(async () => {
    await picker(page).click();
    await expect(page.getByRole('menuitem', { name: style })).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('menuitem', { name: style }).click();
}

async function installUrl(page: Page): Promise<string | null> {
  await page.getByRole('tab', { name: 'URL' }).click();
  return page.getByText(/add https:\/\/ui\.zeroxsolutions\.com\/r\/styles\//).textContent();
}

test("a pasted link's ?style=vega opens in Vega though the reader last picked Nova", async ({ page }) => {
  await page.goto(BUTTON);
  await pickStyle(page, 'Nova');
  await expect(page).toHaveURL(`${BUTTON}?style=nova`);

  await page.goto(`${BUTTON}?style=vega`);

  await expect(picker(page)).toContainText('Vega');
  expect(await installUrl(page)).toContain('/r/styles/nativewind-vega/button.json');
});

test('the picker writes no ?style= for the default, and a page with none shows the last pick', async ({ page }) => {
  await page.goto(`${BUTTON}?style=nova`);
  await expect(picker(page)).toContainText('Nova');

  await pickStyle(page, 'Vega');

  await expect(page).toHaveURL(BUTTON);
  await expect(picker(page)).toContainText('Vega');

  await pickStyle(page, 'Nova');
  await page.goto('/native/components/nativewind/card');

  await expect(picker(page)).toContainText('Nova');
  expect(await installUrl(page)).toContain('/r/styles/nativewind-nova/card.json');
});

test("the web installation's init command and components.json follow the web style picked", async ({ page }) => {
  await page.goto('/docs/installation?style=rhea');

  await expect(page.getByText('pnpm dlx shadcn@latest init --base base --preset rhea')).toBeVisible();
  // The highlighter splits the JSON into one span per token, so the line is matched by its text.
  await expect(page.getByRole('main')).toContainText('"style": "base-rhea"');
  await expect(page.getByRole('main')).toContainText(
    '"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"',
  );
});

test.describe('on a phone-width header', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /** Opens the menu sheet; its button listens only once the page has hydrated, so it is clicked until the sheet opens. */
  async function openMenu(page: Page): Promise<Locator> {
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await expect(async () => {
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(sheet).toBeVisible({ timeout: 1_000 });
    }).toPass();
    return sheet;
  }

  test('the menu sheet switches the engine and picks the style', async ({ page }) => {
    await page.goto(BUTTON);

    const sheet = await openMenu(page);
    await sheet.getByRole('navigation', { name: 'Engine' }).getByRole('link', { name: 'Uniwind' }).click();
    await expect(page).toHaveURL('/native/components/uniwind/button');

    await openMenu(page);
    await pickStyle(page, 'Nova');

    await expect(page).toHaveURL('/native/components/uniwind/button?style=nova');
    expect(await installUrl(page)).toContain('/r/styles/uniwind-nova/button.json');
  });
});
