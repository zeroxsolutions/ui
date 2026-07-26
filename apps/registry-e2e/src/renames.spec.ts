import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Real-browser verification that the composed components render without console
 * errors and carry their `data-slot`. Run against the standalone preview routes
 * (`/preview/<kind>/<slug>`), which render the example raw (no iframe), so the
 * component DOM is directly on the page.
 */

const SHOT_DIR = join(tmpdir(), 'registry-verify');
mkdirSync(SHOT_DIR, { recursive: true });

async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

test.describe('ChatMessage (/preview/components/chat-message)', () => {
  test('renders user and assistant rows with data-slot="chat-message"', async ({
    page,
  }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto('/preview/components/chat-message');

    const messages = page.locator('[data-slot="chat-message"]');
    await expect(messages).toHaveCount(2);
    await expect(messages.nth(0)).toHaveAttribute('data-role', 'user');
    await expect(messages.nth(1)).toHaveAttribute('data-role', 'assistant');

    await page.screenshot({ path: join(SHOT_DIR, 'chat-message.png'), fullPage: true });
    expect(errors, 'no console errors').toEqual([]);
  });
});

test.describe('TreeItem (/preview/components/tree)', () => {
  test('renders rows with data-slot="tree-item"', async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto('/preview/components/tree');

    const items = page.locator('[data-slot="tree-item"]');
    await expect(items).toHaveCount(3);

    await page.screenshot({ path: join(SHOT_DIR, 'tree.png'), fullPage: true });
    expect(errors, 'no console errors').toEqual([]);
  });
});

test.describe('FieldGroup (/preview/components/field-group)', () => {
  test('renders with inner FieldGrid; both carry their data-slot', async ({
    page,
  }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto('/preview/components/field-group');

    await expect(page.locator('[data-slot="field-group"]')).toHaveCount(1);
    await expect(page.locator('[data-slot="field-grid"]')).toHaveCount(1);

    await page.screenshot({ path: join(SHOT_DIR, 'field-group.png'), fullPage: true });
    expect(errors, 'no console errors').toEqual([]);
  });
});
