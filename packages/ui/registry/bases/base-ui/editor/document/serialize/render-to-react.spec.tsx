import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { defineFeature, type DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry } from '@zeroxsolutions/editor-core/document/serialize/index';
import { renderToReact } from './render-to-react';

const bold = defineFeature({
  id: 'bold',
  marks: [{ name: 'bold', htmlTag: 'strong' }],
  markCodecs: [{ mark: 'bold', toReact: (_mark, children) => <strong>{children as ReactNode}</strong> }],
});

const mermaid = defineFeature({
  id: 'mermaid',
  nodes: [{ name: 'mermaid', group: 'block', atom: true, attrs: z.object({ source: z.string() }) }],
  codecs: [{ node: 'mermaid', toReact: (node) => <pre data-type="mermaid">{String(node.attrs?.source ?? '')}</pre> }],
});

const registry = createCodecRegistry([bold, mermaid]);

const sampleDoc: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'hello ' },
        { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
      ],
    },
    { type: 'mermaid', attrs: { source: 'graph TD; A-->B' } },
  ],
};

describe('renderToReact', () => {
  it("draws each node and mark through its feature's React codec, for the static Viewer", () => {
    const html = renderToStaticMarkup(<>{renderToReact(sampleDoc, registry)}</>);
    expect(html).toBe('<p>hello <strong>world</strong></p><pre data-type="mermaid">graph TD; A--&gt;B</pre>');
  });
});
