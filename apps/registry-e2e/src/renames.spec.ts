import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Real-browser verification that the renamed/cluster-2 components render
 * without console errors and carry their `data-slot` attribute. Covers
 * ChatMessage, TreeItem (composed with TreeIndent), and FieldGroup (which
 * nests a FieldGrid). The renames are the public surface renamed in the
 * `redesign-composed-layer` cluster; this spec is the visual check the green
 * gate cannot provide.
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

test.describe('ChatMessage (/preview/chat-message)', () => {
  test('renders user and assistant rows with data-slot="chat-message"', async ({
    page,
  }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto('/preview/chat-message');

    await expect(
      page.getByRole('heading', { level: 1, name: 'ChatMessage' })
    ).toBeVisible();

    const messages = page.locator('[data-slot="chat-message"]');
    await expect(messages).toHaveCount(2);
    await expect(messages.nth(0)).toHaveAttribute('data-role', 'user');
    await expect(messages.nth(1)).toHaveAttribute('data-role', 'assistant');

    await page.screenshot({
      path: join(SHOT_DIR, 'chat-message.png'),
      fullPage: true,
    });

    expect(errors, 'no console errors').toEqual([]);
  });
});

test.describe('TreeItem (/preview/tree)', () => {
  test('renders rows with data-slot="tree-item"', async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto('/preview/tree');

    await expect(
      page.getByRole('heading', { level: 1, name: 'TreeItem' })
    ).toBeVisible();

    // TreeItem composes TreeIndent; the outer row carries `data-slot="tree-item"`
    // (TreeItem's own slot, which surfaces on the shared outer DOM in place of
    // TreeIndent's). Both slots are valid for the composed row per the task spec
    // ("tree-item/tree-indent"); assert tree-item here.
    const items = page.locator('[data-slot="tree-item"]');
    await expect(items).toHaveCount(3);

    await page.screenshot({
      path: join(SHOT_DIR, 'tree.png'),
      fullPage: true,
    });

    expect(errors, 'no console errors').toEqual([]);
  });
});

test.describe('FieldGroup (/preview/field-group)', () => {
  test('renders with inner FieldGrid; both carry their data-slot', async ({
    page,
  }) => {
    const errors = await captureConsoleErrors(page);
    await page.goto('/preview/field-group');

    await expect(
      page.getByRole('heading', { level: 1, name: 'FieldGroup' })
    ).toBeVisible();

    const group = page.locator('[data-slot="field-group"]');
    await expect(group).toHaveCount(1);

    // FieldGroup composes a FieldGrid (the inner grid wrapper).
    const grid = page.locator('[data-slot="field-grid"]');
    await expect(grid).toHaveCount(1);

    await page.screenshot({
      path: join(SHOT_DIR, 'field-group.png'),
      fullPage: true,
    });

    expect(errors, 'no console errors').toEqual([]);
  });
});
