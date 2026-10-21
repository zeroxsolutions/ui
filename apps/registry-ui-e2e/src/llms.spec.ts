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

test('/llms.txt and /llms-full.txt carry the native pages at their /native URLs', async ({ request }) => {
  const index = await (await request.get('/llms.txt')).text();
  expect(index).toContain('# Native components');
  expect(index).toContain('[Installation](/native/docs/installation)');
  expect(index).toContain('[Button](/native/components/nativewind/button)');
  expect(index).not.toContain('/docs/native');
  expect(index).not.toContain('/native/components/uniwind');

  const full = await (await request.get('/llms-full.txt')).text();
  expect(full).toContain('# Button (/native/components/nativewind/button)');
});

test('a native page answers as Markdown at its URL plus .md, under either engine', async ({ request }) => {
  for (const [path, heading] of [
    ['/native/docs.md', '# Introduction (/native/docs)'],
    ['/native/docs/installation.md', '# Installation (/native/docs/installation)'],
    ['/native/components/uniwind/button.md', '# Button (/native/components/uniwind/button)'],
    ['/native/components/nativewind.md', '(/native/components/nativewind)'],
  ]) {
    const response = await request.get(path);

    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain('text/markdown');
    expect(await response.text(), path).toContain(heading);
  }
});

test("a native component page's Markdown is written for its engine, with no JSX left", async ({ request }) => {
  for (const path of ['/native/components/uniwind/theme.md', '/native/components/uniwind/button.md']) {
    const text = await (await request.get(path)).text();
    const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, '');

    expect(text, path).toContain('/r/styles/uniwind-vega/');
    expect(text, path).toMatch(/```tsx title="[a-z-]+-demo\.tsx"\n/);
    expect(prose, path).not.toMatch(/<[A-Z]/);
    expect(prose, path).not.toContain('/native/components/nativewind/');
  }
});
