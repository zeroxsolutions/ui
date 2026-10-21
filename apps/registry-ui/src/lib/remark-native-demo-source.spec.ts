// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { remarkNativeDemoSource } from './remark-native-demo-source';

interface Node {
  type: string;
  name?: string;
  attributes?: { type: string; name: string; value?: unknown }[];
  children?: Node[];
}

function preview(name: string): Node {
  return {
    type: 'mdxJsxFlowElement',
    name: 'NativePreview',
    attributes: [{ type: 'mdxJsxAttribute', name: 'name', value: name }],
    children: [],
  };
}

describe('remarkNativeDemoSource', () => {
  it("gives a NativePreview its demo's source, so the page's Markdown carries it", async () => {
    const element = preview('button-demo');

    await remarkNativeDemoSource()({ type: 'root', children: [element] });

    const source = await readFile(
      resolve(import.meta.dirname, '../../../../packages/native-ui/src/examples/button-demo.tsx'),
      'utf8',
    );
    expect(element.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'code', value: source.trimEnd() });
  });

  it('fails the page on a NativePreview naming no native demo', async () => {
    await expect(remarkNativeDemoSource()({ type: 'root', children: [preview('no-such-demo')] })).rejects.toThrow(
      /no-such-demo/,
    );
  });
});
