// @vitest-environment node
import { asMarkdown, jsxComponents, renderToMarkdown } from 'fumadocs-core/server';
import { createElement, type ElementType, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { registryHomepage } from '@/lib/registry';

import { nativePageMarkdown, nativePageMarkdownByStyle } from './native-page-markdown';

/**
 * A native page's body in the form `remarkLLMs` compiles with `output: 'function'`: its Markdown as
 * strings, its MDX components as elements resolved from `props.components`, each with the props the
 * page wrote (and the `code` the compile step gives a `NativePreview`).
 */
function ButtonPageBody(props: { components?: Record<string, ElementType> }): ReactNode {
  if (!asMarkdown()) return null;
  const c = jsxComponents(props.components);
  return (
    <>
      <c.NativePreview name="button-demo" code={'export function ButtonDemo() {\n  return null;\n}'} />
      {'## Installation\n\n'}
      <c.InstallCommand name="button" />
      {
        'Installs [Text](/native/components/nativewind/text) and [Theme](/native/components/nativewind/theme#tokens), see [Installation](/native/docs/installation).\n\n'
      }
      <c.EngineTabs>
        <c.EngineTab engine="nativewind">{'- NativeWind writes `tailwind.config.js`.\n\n'}</c.EngineTab>
        <c.EngineTab engine="uniwind">{'- Uniwind writes `zui-theme.css`.\n\n'}</c.EngineTab>
      </c.EngineTabs>
      <c.ComponentsJson engine="uniwind" />
      {'```tsx\n<Button>\n  <Text>Add</Text>\n</Button>\n```\n'}
    </>
  );
}

/** A page as the native loaders give it, its `getText` rendering the compiled body as fumadocs-mdx does. */
const buttonPage = {
  url: '/native/components/uniwind/button',
  data: {
    title: 'Button',
    getText: (_type: string, options?: { components?: object }) =>
      renderToMarkdown(
        createElement(ButtonPageBody, { components: options?.components as Record<string, ElementType> | undefined }),
      ),
  },
};

/** The Markdown with its fenced code removed, where a page's own example may hold JSX. */
function prose(markdown: string): string {
  return markdown.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, '');
}

describe('nativePageMarkdown', () => {
  it('leaves no JSX tag outside the fenced code', async () => {
    const markdown = await nativePageMarkdown(buttonPage, { engine: 'uniwind', style: 'vega' });

    expect(markdown).toMatch(/^# Button \(\/native\/components\/uniwind\/button\)\n/);
    expect(prose(markdown)).not.toMatch(/<[A-Z]/);
    expect(markdown).toContain('```tsx\n<Button>');
  });

  it("gives the install command by the @zui name and by its URL in the page's engine and style", async () => {
    const markdown = await nativePageMarkdown(buttonPage, { engine: 'uniwind', style: 'nova' });

    expect(markdown).toContain('```bash\npnpm dlx shadcn@latest add @zui/button\n```');
    expect(markdown).toContain(
      `\`\`\`bash\npnpm dlx shadcn@latest add ${new URL('r/styles/uniwind-nova/button.json', registryHomepage).href}\n\`\`\``,
    );
  });

  it("gives components.json as a json block in the page's style", async () => {
    const markdown = await nativePageMarkdown(buttonPage, { engine: 'uniwind', style: 'vega' });

    expect(markdown).toMatch(/```json title="components.json"\n\{[\s\S]*"style": "uniwind-vega"[\s\S]*\n```/);
  });

  it("keeps only the page engine's tab of an EngineTabs", async () => {
    const markdown = await nativePageMarkdown(buttonPage, { engine: 'uniwind', style: 'vega' });

    expect(markdown).toContain('- Uniwind writes `zui-theme.css`.');
    expect(markdown).not.toContain('tailwind.config.js`.');
  });

  it("gives every engine's tab under its name on a page with no engine", async () => {
    const markdown = await nativePageMarkdown({ ...buttonPage, url: '/native/docs/installation' }, { style: 'vega' });

    expect(markdown).toMatch(/\*\*NativeWind\*\*\n\n- NativeWind writes[\s\S]*\*\*Uniwind\*\*\n\n- Uniwind writes/);
    expect(markdown).toContain('add @zui/button');
    expect(markdown).toContain('r/styles/nativewind-vega/button.json');
  });

  it("gives a NativePreview's demo source as a tsx block", async () => {
    const markdown = await nativePageMarkdown(buttonPage, { engine: 'uniwind', style: 'vega' });

    expect(markdown).toContain(
      '```tsx title="button-demo.tsx"\nexport function ButtonDemo() {\n  return null;\n}\n```',
    );
  });

  it("moves links to other component pages onto the page's engine and leaves the docs' links", async () => {
    const markdown = await nativePageMarkdown(buttonPage, { engine: 'uniwind', style: 'vega' });

    expect(markdown).toContain('[Text](/native/components/uniwind/text)');
    expect(markdown).toContain('[Theme](/native/components/uniwind/theme#tokens)');
    expect(markdown).toContain('[Installation](/native/docs/installation)');
    expect(markdown).not.toContain('/native/components/nativewind/');
  });

  it('gives the page once per native style, each with its own install URL', async () => {
    const byStyle = await nativePageMarkdownByStyle(buttonPage, 'uniwind');

    expect(Object.keys(byStyle).sort()).toEqual(['nova', 'vega']);
    expect(byStyle.vega).toContain('r/styles/uniwind-vega/button.json');
    expect(byStyle.nova).toContain('r/styles/uniwind-nova/button.json');
  });
});
