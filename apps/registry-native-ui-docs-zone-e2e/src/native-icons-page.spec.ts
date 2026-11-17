import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';
import { DRAWN, frame, inside } from './test/native-preview';

test.slow(true, 'the frame may take all of DRAWN to draw, and then loads the icons as a chunk of their own');

test("the header's Icons entry opens the native icons page, whose frame draws the icons", async ({ page }) => {
  await page.goto('/native/docs');
  await waitForHydration(page);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Icons', exact: true }).click();

  await expect(page).toHaveURL('/native/icons/nativewind');
  await expect(page.getByRole('heading', { level: 1, name: 'Icons' })).toBeVisible();
  const gallery = inside(page, 'Icon gallery demo');
  await expect(gallery.getByRole('heading', { name: 'lucide' })).toBeVisible(DRAWN);
  await expect(gallery.getByRole('button', { name: 'a-arrow-down', exact: true }).locator('svg')).toBeVisible(DRAWN);
});

test("the page's search narrows the frame's grid, and an icon tapped there shows its install line", async ({
  page,
}) => {
  await page.goto('/native/icons/uniwind?q=arrow-up');
  const gallery = inside(page, 'Icon gallery demo');
  const tile = gallery.getByRole('button', { name: 'arrow-up', exact: true });

  await expect(tile).toBeVisible(DRAWN);
  await expect(gallery.getByRole('button', { name: 'arrow-down', exact: true })).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Search icons' }).fill('copy');
  await expect(gallery.getByRole('button', { name: 'copy', exact: true })).toBeVisible();
  await expect(tile).toHaveCount(0);

  await gallery.getByRole('button', { name: 'copy', exact: true }).click();
  await expect(page.getByRole('region', { name: 'copy' })).toContainText(
    'pnpm dlx shadcn@latest add @zui/lucide-copy-icon',
  );
});

test('the frame keeps a fixed height, and the grid scrolls inside it to the icons at the end of the set', async ({
  page,
}) => {
  await page.goto('/native/icons/nativewind');
  const gallery = inside(page, 'Icon gallery demo');
  const first = gallery.getByRole('button', { name: 'a-arrow-down', exact: true });
  await expect(first).toBeVisible(DRAWN);
  await expect.poll(async () => (await frame(page, 'Icon gallery demo').boundingBox())?.height).toBe(560);

  const zap = gallery.getByRole('button', { name: 'zap', exact: true });
  await first.hover();
  // Read against the frame's box, which runs below a desktop viewport.
  await expect(async () => {
    await page.mouse.wheel(0, 600);
    await expect(zap).toBeAttached({ timeout: 500 });
    const [outer, inner] = await Promise.all([frame(page, 'Icon gallery demo').boundingBox(), zap.boundingBox()]);
    expect(
      outer !== null && inner !== null && inner.y >= outer.y && inner.y + inner.height <= outer.y + outer.height,
    ).toBe(true);
  }).toPass({ timeout: 30_000 });
});

test("the page's empty status and the frame's both print what the reader typed", async ({ page }) => {
  await page.goto('/native/icons/nativewind?q=Arrow+Sideways');
  const gallery = inside(page, 'Icon gallery demo');
  const empty = 'No icon has a name holding "Arrow Sideways".';

  // The frame's spinner is a status too, until the preview has drawn.
  await expect(page.getByRole('status').filter({ hasText: empty })).toBeVisible();
  await expect(gallery.getByText(empty)).toBeVisible(DRAWN);
});
