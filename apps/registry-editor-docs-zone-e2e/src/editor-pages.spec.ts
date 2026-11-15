import { editorItems as items } from './test/editor-items';
import { expect, test } from './test/fixtures';

// The document `Editor` builds its view in an effect, so these twelve demos render on the server only their
// wrapper and an empty `div[data-editor=document]`; the editor fills it once the page has hydrated.
const BUILDS_IN_AN_EFFECT = new Set([
  'document-editor',
  'editor-features',
  ...['callout', 'code-block', 'embed', 'image', 'link', 'math', 'mention', 'mermaid', 'table', 'toggle'].map(
    (feature) => `editor-${feature}`,
  ),
]);

// A library draws nothing, so its page has no preview and shows its install and usage steps instead.
const LIBRARIES = new Set(['editor-theme', 'editor-code-mirror']);

const STAGE = '[data-slot=component-preview-stage]';

test('the registry names the editor items this spec covers', () => {
  expect(items.length).toBeGreaterThan(0);
  for (const name of [...BUILDS_IN_AN_EFFECT, ...LIBRARIES]) {
    expect(
      items.map((item) => item.name),
      name,
    ).toContain(name);
  }
});

test('every editor page renders its demo on the server, fits a phone, and throws nothing', async ({
  page,
  request,
  browser,
}) => {
  // Each page is prerendered, but 17 of them across a cold worker outrun the default deadline.
  test.setTimeout(270_000);
  // Scripts off, so what the page holds is what the server sent and no effect has filled anything.
  const served = await browser.newContext({ javaScriptEnabled: false });
  const unhydrated = await served.newPage();

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`);
  });
  await page.setViewportSize({ width: 390, height: 844 });

  for (const { name, title } of items) {
    const path = `/docs/editor/${name}`;
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    await unhydrated.setContent(await response.text());

    if (LIBRARIES.has(name)) {
      await expect(unhydrated.locator(STAGE), name).toHaveCount(0);
      await expect(unhydrated.getByRole('heading', { level: 2, name: 'Installation' }), name).toBeVisible();
      await expect(unhydrated.getByRole('heading', { level: 2, name: 'Usage' }), name).toBeVisible();
    } else {
      const stage = unhydrated.locator(STAGE).first();
      await expect(stage, `${name} on the server`).toHaveCount(1);
      if (BUILDS_IN_AN_EFFECT.has(name)) {
        await expect(stage.locator('[data-editor=document]'), `${name} on the server`).toHaveCount(1);
      } else {
        // More than an empty fallback: the demo's own markup is inside the stage.
        const markup = await stage.locator('> [data-slot=scroll-area-viewport] *').count();
        expect(markup, `${name}: the stage holds only its fallback`).toBeGreaterThan(1);
      }
    }

    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    if (!LIBRARIES.has(name)) await expect(page.locator(STAGE).first()).toBeVisible();
    // Measured once the page's own requests settle: a demo widened by an image or a font that arrives
    // late would otherwise pass on the first sample, taken before it lands.
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
    await expect
      .poll(() => page.evaluate('document.scrollingElement.scrollWidth > window.innerWidth'), { message: name })
      .toBe(false);
    // The page never scrolls sideways because each stage scrolls its own demo, so a demo too wide for a
    // phone shows only as its stage scrolling. A stage's viewport is its direct child.
    await expect
      .poll(
        () =>
          page
            .locator(`${STAGE} > [data-slot=scroll-area-viewport]`)
            // Named structurally, because this project's tsconfig carries no 'dom' lib for the
            // callback's parameter to draw scrollWidth and clientWidth from by its DOM type.
            .evaluateAll((viewports: { scrollWidth: number; clientWidth: number }[]) =>
              viewports
                .filter((viewport) => viewport.scrollWidth > viewport.clientWidth)
                .map((viewport) => `${viewport.scrollWidth} > ${viewport.clientWidth}`),
            ),
        { message: `${name}: a preview stage scrolls sideways` },
      )
      .toEqual([]);
  }

  await served.close();
  expect(errors.filter((error) => /hydrat/i.test(error))).toEqual([]);
  expect(errors).toEqual([]);
});
