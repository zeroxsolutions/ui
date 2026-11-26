import { expect, test } from './test/fixtures';
import { hydrated } from './test/hydrated';

for (const [device, width] of [
  ['Tablet', 768],
  ['Mobile', 375],
] as const) {
  test(`${device} frames the demo in a window ${width}px wide, which its breakpoints read`, async ({ page }) => {
    await page.goto('/docs/components/base/ai-provider-picker');
    const toggle = page
      .getByRole('group', { name: 'Device' })
      .first()
      .getByRole('button', { name: device, exact: true });
    await hydrated(toggle);

    await toggle.click();

    const frame = page.getByTitle(new RegExp(`^ai-provider-picker-demo, ${device.toLowerCase()}, `));
    const body = frame.contentFrame().locator('body');
    await expect(frame.contentFrame().getByRole('button', { name: 'Select OpenAI' })).toBeVisible();
    expect(
      await body.evaluate(
        (element: { ownerDocument: { defaultView: { innerWidth: number } } }) =>
          element.ownerDocument.defaultView.innerWidth,
      ),
    ).toBe(width);
  });
}
