import { expect, test } from './test/fixtures';

test('/native/llms.txt and /native/llms-full.txt carry the native pages at their /native URLs', async ({ request }) => {
  const index = await (await request.get('/native/llms.txt')).text();
  expect(index).toContain('# Native components');
  expect(index).toContain('[Installation](/native/docs/installation)');
  expect(index).toContain('[Button](/native/components/nativewind/button)');
  expect(index).not.toContain('/docs/native');
  expect(index).not.toContain('/native/components/uniwind');

  const full = await (await request.get('/native/llms-full.txt')).text();
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

  // The theme page's NativeWind tab names `tailwind.config.js`; under Uniwind only its own tab is kept.
  const theme = await (await request.get('/native/components/uniwind/theme.md')).text();
  expect(theme).toContain('`zui-theme.css` at the project root');
  expect(theme).not.toContain('`tailwind.config.js` gains');
});

test('/native/llms.txt lists the later native components, and each answers as Markdown under both engines', async ({
  request,
}) => {
  const index = await (await request.get('/native/llms.txt')).text();

  for (const name of ['dialog', 'select', 'calendar', 'sonner', 'chart', 'sidebar', 'code-block']) {
    expect(index, name).toContain(`(/native/components/nativewind/${name})`);

    for (const engine of ['nativewind', 'uniwind']) {
      const response = await request.get(`/native/components/${engine}/${name}.md`);

      expect(response.status(), `${engine} ${name}`).toBe(200);
      expect(await response.text(), `${engine} ${name}`).toContain(`(/native/components/${engine}/${name})`);
    }
  }
});
