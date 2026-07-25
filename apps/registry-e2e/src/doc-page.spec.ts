import { test, expect } from '@playwright/test';

/**
 * Real-browser coverage for the doc-page foundation (Decision 2 + the
 * complete-doc-page requirement). Drives `/preview/button` as the reference
 * instance and asserts every section renders: the Preview frame, the
 * `shadcn add` command, the Props table, the Composition tree, and the
 * dark-mode toggle that flips `.dark` on `<html>`.
 */
const BUTTON_VARIANTS = ['Default', 'Secondary', 'Outline', 'Destructive', 'Ghost'];

test.describe('Doc page (/preview/button)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preview/button');
  });

  test('renders the title, description, and dark-mode toggle in the header', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Button' })
    ).toBeVisible();
    await expect(page.getByText(/Button primitive/i).first()).toBeVisible();
    await expect(
      page.locator('[data-slot="dark-mode-toggle"]')
    ).toBeVisible();
  });

  test('renders every Button variant in the Preview tab', async ({ page }) => {
    const frame = page.locator('[data-slot="component-preview"]');
    await expect(frame).toBeVisible();

    for (const name of BUTTON_VARIANTS) {
      await expect(
        frame.getByRole('button', { name, exact: true })
      ).toBeVisible();
    }
  });

  test('renders the shadcn add command and import snippet in the Code tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Code' }).click();

    const codePanel = page.locator('[data-slot="doc-tab-code"]');
    await expect(codePanel).toBeVisible();
    await expect(codePanel).toContainText(
      'npx shadcn add https://registry.zeroxsolutions.com/r/button.json'
    );
    await expect(codePanel).toContainText(
      "import { Button } from '@zeroxsolutions/ui/components/ui/button';"
    );
  });

  test('renders the Props table with Button rows in the Props tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Props' }).click();

    const propsPanel = page.locator('[data-slot="doc-tab-props"]');
    await expect(propsPanel).toBeVisible();
    const table = propsPanel.locator('[data-slot="props-table"]');
    await expect(table).toBeVisible();
    // `exact` because `variant` and `size` appear as substrings of the
    // description text in other rows.
    await expect(
      table.getByRole('cell', { name: 'variant', exact: true })
    ).toBeVisible();
    await expect(
      table.getByRole('cell', { name: 'size', exact: true })
    ).toBeVisible();
  });

  test('renders the Composition tree for Button in the Composition tab', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Composition' }).click();

    const compositionPanel = page.locator('[data-slot="doc-tab-composition"]');
    await expect(compositionPanel).toBeVisible();
    const tree = compositionPanel.locator('[data-slot="composition-tree"]');
    await expect(tree).toBeVisible();
    // Button is a leaf - the root is rendered with its slot badge.
    await expect(tree.getByText('Button')).toBeVisible();
  });

  test('the dark-mode toggle flips the .dark class on <html>', async ({
    page,
  }) => {
    const toggle = page.locator('[data-slot="dark-mode-toggle"]');

    // Default is light - no `.dark` class on <html>.
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);

    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    // Toggling again flips back to light.
    await toggle.click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });
});

/**
 * Parameterized doc-page coverage for the cluster-4 components (Decision 1:
 * hand-authored per item). For each page: the title renders, the Code tab
 * carries the `shadcn add` command and import snippet, the Props table
 * renders, and the Composition tree renders. Per-item Preview interactions
 * (radius seam, data-slot presence) live in their own specs.
 */
const DOC_PAGES = [
  {
    slug: 'split-button',
    title: 'SplitButton',
    itemName: 'split-button',
    importPath: 'components/split-button',
    exportName: 'SplitButton',
    /** A prop name guaranteed to appear in the Props table. */
    propCell: 'SplitButtonAction',
    /** The Composition tree's root node name. */
    compositionRoot: 'SplitButton',
  },
  {
    slug: 'menu-button',
    title: 'MenuButton',
    itemName: 'menu-button',
    importPath: 'components/menu-button',
    exportName: 'MenuButton',
    propCell: 'MenuButtonAction',
    compositionRoot: 'MenuButton',
  },
  {
    slug: 'chat-message',
    title: 'ChatMessage',
    itemName: 'chat-message',
    importPath: 'components/chat/chat-message',
    exportName: 'ChatMessage',
    propCell: 'role',
    compositionRoot: 'ChatMessage',
  },
  {
    slug: 'tree',
    title: 'TreeItem',
    itemName: 'tree-item',
    importPath: 'components/tree-item',
    exportName: 'TreeItem',
    propCell: 'name',
    compositionRoot: 'TreeItem',
  },
  {
    slug: 'field-group',
    title: 'FieldGroup',
    itemName: 'field-group',
    importPath: 'components/layouts/field-group',
    exportName: 'FieldGroup',
    propCell: 'cols',
    compositionRoot: 'FieldGroup',
  },
] as const;

for (const docPage of DOC_PAGES) {
  test.describe(`Doc page (/preview/${docPage.slug})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/preview/${docPage.slug}`);
    });

    test('renders the title and dark-mode toggle in the header', async ({
      page,
    }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: docPage.title })
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="dark-mode-toggle"]')
      ).toBeVisible();
    });

    test('renders the live preview in the Preview tab', async ({ page }) => {
      const frame = page.locator('[data-slot="component-preview"]');
      await expect(frame).toBeVisible();
    });

    test('renders the shadcn add command and import snippet in the Code tab', async ({
      page,
    }) => {
      await page.getByRole('tab', { name: 'Code' }).click();

      const codePanel = page.locator('[data-slot="doc-tab-code"]');
      await expect(codePanel).toBeVisible();
      await expect(codePanel).toContainText(
        `npx shadcn add https://registry.zeroxsolutions.com/r/${docPage.itemName}.json`
      );
      await expect(codePanel).toContainText(
        `import { ${docPage.exportName} } from '@zeroxsolutions/ui/${docPage.importPath}';`
      );
    });

    test('renders the Props table in the Props tab', async ({ page }) => {
      await page.getByRole('tab', { name: 'Props' }).click();

      const propsPanel = page.locator('[data-slot="doc-tab-props"]');
      await expect(propsPanel).toBeVisible();
      const table = propsPanel.locator('[data-slot="props-table"]');
      await expect(table).toBeVisible();
      await expect(
        table.getByRole('cell', { name: docPage.propCell, exact: true })
      ).toBeVisible();
    });

    test('renders the Composition tree in the Composition tab', async ({
      page,
    }) => {
      await page.getByRole('tab', { name: 'Composition' }).click();

      const compositionPanel = page.locator(
        '[data-slot="doc-tab-composition"]'
      );
      await expect(compositionPanel).toBeVisible();
      const tree = compositionPanel.locator('[data-slot="composition-tree"]');
      await expect(tree).toBeVisible();
      // `exact` because a compound root name (e.g. "SplitButton") is a prefix
      // of every child node name ("SplitButtonAction", "SplitButtonMenu", ...),
      // so a substring match would be ambiguous.
      await expect(
        tree.getByText(docPage.compositionRoot, { exact: true })
      ).toBeVisible();
    });
  });
}
