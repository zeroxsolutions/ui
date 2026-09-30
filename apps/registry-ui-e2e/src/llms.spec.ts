import { expect, test } from '@playwright/test';

test('/llms.txt indexes the pages and /docs/<slug>.md answers with one page as Markdown', async ({ request }) => {
  const index = await request.get('/llms.txt');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain('[Status Indicator](/docs/components/status-indicator)');

  const page = await request.get('/docs/components/status-indicator.md');
  expect(page.status()).toBe(200);
  expect(page.headers()['content-type']).toContain('text/markdown');
  const text = await page.text();
  expect(text).toContain('# Status Indicator (/docs/components/status-indicator)');
  expect(text).toContain('The dot is hidden from assistive technology, so the text beside it carries the status');
});
