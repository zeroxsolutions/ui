import { expect, test } from './test/fixtures';

test('/llms.txt indexes the pages and /docs/<slug>.md answers with one page as Markdown', async ({ request }) => {
  const index = await request.get('/llms.txt');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain('[Status Indicator](/docs/components/base/status-indicator)');

  const page = await request.get('/docs/components/base/status-indicator.md');
  expect(page.status()).toBe(200);
  expect(page.headers()['content-type']).toContain('text/markdown');
  const text = await page.text();
  expect(text).toContain('# Status Indicator (/docs/components/base/status-indicator)');
  expect(text).toContain('The dot is hidden from assistive technology, so the text beside it carries the status');
});

test("/llms.txt links the native zone's index, and neither file holds a native page", async ({ request }) => {
  const index = await (await request.get('/llms.txt')).text();
  expect(index).toContain('(/native/llms.txt)');
  expect(index).not.toContain('/native/docs');
  expect(index).not.toContain('/native/components');

  const full = await (await request.get('/llms-full.txt')).text();
  expect(full).toContain('# Status Indicator (/docs/components/base/status-indicator)');
  expect(full).not.toContain('(/native/');
});
