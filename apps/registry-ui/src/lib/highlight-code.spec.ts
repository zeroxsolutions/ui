import { codeToHast, type ShikiTransformer } from 'shiki';
import { describe, expect, it } from 'vitest';

import { highlightCode, packageManagerCommands, transformers } from './highlight-code';

describe('highlightCode', () => {
  it("returns a pre whose tokens carry both themes' colours", async () => {
    const html = await highlightCode('const a = 1', 'ts');

    expect(html).toMatch(/^<pre /);
    // github-light's keyword red, and github-dark's as the dark variable.
    expect(html).toContain('color:#D73A49');
    expect(html).toContain('--shiki-dark:#F97583');
    expect(html).toContain('data-line-numbers');
    expect(html).toContain('data-line=""');
  });
});

describe('packageManagerCommands', () => {
  it('spells an npx command for each package manager', () => {
    expect(packageManagerCommands('npx shadcn@latest add x')).toEqual({
      npm: 'npx shadcn@latest add x',
      yarn: 'yarn dlx shadcn@latest add x',
      pnpm: 'pnpm dlx shadcn@latest add x',
      bun: 'bunx --bun shadcn@latest add x',
    });
  });

  it('leaves a command no package manager rewrites alone', () => {
    expect(packageManagerCommands('git status')).toBeUndefined();
  });
});

describe('transformers', () => {
  async function fence(code: string, lang: string, title?: string) {
    return codeToHast(code, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark' },
      // fumadocs' Shiki runs these at compile; the app's own, one release behind, stands in for it here.
      transformers: transformers as unknown as ShikiTransformer[],
      meta: title ? { title } : {},
    });
  }

  it('heads a fence with a figcaption carrying its language, and its title when it has one', async () => {
    const untitled = JSON.stringify(await fence('const a = 1', 'tsx'));
    expect(untitled).toContain('"data-code-figure"');
    expect(untitled).toContain('"tagName":"figcaption"');
    expect(untitled).toContain('"data-language":"tsx"');

    const titled = JSON.stringify(await fence('const a = 1', 'tsx', 'app.tsx'));
    expect(titled).toContain('"value":"app.tsx"');
  });

  it('puts the raw text and each package manager spelling on a command, and no figcaption', async () => {
    const tree = JSON.stringify(await fence('npx shadcn@latest add x', 'bash'));

    expect(tree).toContain('"__raw__":"npx shadcn@latest add x"');
    expect(tree).toContain('"__pnpm__":"pnpm dlx shadcn@latest add x"');
    expect(tree).not.toContain('"tagName":"figcaption"');
  });
});
