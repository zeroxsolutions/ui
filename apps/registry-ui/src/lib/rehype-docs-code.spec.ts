// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { rehypeDocsCode } from './rehype-docs-code';

interface Node {
  type: string;
  tagName?: string;
  name?: string;
  value?: string;
  properties?: Record<string, unknown>;
  attributes?: { type: string; name: string; value?: unknown }[];
  data?: { meta?: string };
  children?: Node[];
}

function fence(text: string, language: string, meta?: string): Node {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [
      {
        type: 'element',
        tagName: 'code',
        properties: { className: [`language-${language}`] },
        data: meta ? { meta } : undefined,
        children: [{ type: 'text', value: `${text}\n` }],
      },
    ],
  };
}

function jsx(name: string, attributes: Record<string, string>): Node {
  return {
    type: 'mdxJsxFlowElement',
    name,
    attributes: Object.entries(attributes).map(([key, value]) => ({ type: 'mdxJsxAttribute', name: key, value })),
    children: [],
  };
}

function attribute(node: Node, name: string): unknown {
  return node.attributes?.find((item) => item.name === name)?.value;
}

async function run(...children: Node[]): Promise<void> {
  await rehypeDocsCode()({ type: 'root', children });
}

describe('rehypeDocsCode', () => {
  it("gives a fence's pre its title and its tokenized lines", async () => {
    const pre = fence('const a = 1', 'ts', 'title="a.ts"');

    await run(pre);

    expect(pre.properties?.title).toBe('a.ts');
    const [line] = JSON.parse(String(pre.properties?.lines)) as { content: string; style?: object }[][];
    expect(line.map((token) => token.content).join('')).toBe('const a = 1');
    expect(line.some((token) => token.style)).toBe(true);
  });

  it('gives a ComponentSource the source of the file it names, its language and its lines', async () => {
    const source = jsx('ComponentSource', { name: 'status-indicator' });

    await run(source);

    expect(attribute(source, 'code')).toContain('function StatusIndicator');
    expect(attribute(source, 'language')).toBe('tsx');
    expect(JSON.parse(String(attribute(source, 'lines')))).toHaveLength(
      String(attribute(source, 'code')).split('\n').length,
    );
  });

  it('fails the page on a name the examples index lacks', async () => {
    await expect(run(jsx('ComponentPreview', { name: 'no-such-demo' }))).rejects.toThrow(/no-such-demo/);
  });
});
