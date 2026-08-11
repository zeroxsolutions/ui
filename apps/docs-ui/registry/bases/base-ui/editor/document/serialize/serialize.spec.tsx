import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { defineFeature, type DocJSON, type SerializeContext } from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importMarkdown,
  serialize,
  validateDoc,
  type ImportReport,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { renderToReact } from './render-to-react';

const bold = defineFeature({
  id: 'bold',
  marks: [{ name: 'bold', htmlTag: 'strong' }],
  markCodecs: [
    {
      mark: 'bold',
      toMarkdown: () => ({ open: '**', close: '**' }),
      toHTML: () => ({ open: '<strong>', close: '</strong>' }),
      toReact: (_mark, children) => <strong>{children as ReactNode}</strong>,
      fromMarkdown: (token) =>
        token.type === 'strong' ? { type: 'bold' } : null,
      fromHTML: (element) =>
        element.tagName === 'STRONG' ? { type: 'bold' } : null,
    },
  ],
});

// A custom block whose Markdown form is a fenced ```mermaid code block — the
// "custom block survives Markdown import" case that the token path preserves.
const mermaid = defineFeature({
  id: 'mermaid',
  nodes: [
    {
      name: 'mermaid',
      group: 'block',
      atom: true,
      attrs: z.object({ source: z.string() }),
    },
  ],
  codecs: [
    {
      node: 'mermaid',
      toMarkdown: (node) =>
        '```mermaid\n' + String(node.attrs?.source ?? '') + '\n```',
      toHTML: (node) =>
        `<pre data-type="mermaid">${String(node.attrs?.source ?? '')}</pre>`,
      toReact: (node) => (
        <pre data-type="mermaid">{String(node.attrs?.source ?? '')}</pre>
      ),
      fromMarkdown: (token) =>
        token.type === 'code' && token.lang === 'mermaid'
          ? { type: 'mermaid', attrs: { source: token.value ?? '' } }
          : null,
    },
  ],
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

describe('serialization', () => {
  it('JSON round-trips losslessly (source of truth)', () => {
    expect(JSON.parse(JSON.stringify(sampleDoc))).toEqual(sampleDoc);
  });

  it('exports Markdown via per-node/mark codecs', () => {
    const md = serialize(sampleDoc, 'markdown', registry);
    expect(md).toContain('hello **world**');
    expect(md).toContain('```mermaid\ngraph TD; A-->B\n```');
  });

  it('exports HTML via per-node/mark codecs', () => {
    const html = serialize(sampleDoc, 'html', registry);
    expect(html).toContain('<p>hello <strong>world</strong></p>');
    expect(html).toContain('<pre data-type="mermaid">graph TD; A-->B</pre>');
  });

  it('exports a React tree for the static Viewer', () => {
    const html = renderToStaticMarkup(
      <>{renderToReact(sampleDoc, registry)}</>,
    );
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('data-type="mermaid"');
  });

  it('uses the configured fallback when a node has no codec', () => {
    const bare = createCodecRegistry([]); // only doc/paragraph substrate
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'unknownWrapper',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
          ],
        },
      ],
    };
    expect(() => serialize(doc, 'markdown', bare)).not.toThrow();
    expect(serialize(doc, 'markdown', bare)).toContain('x');
  });

  it('imports Markdown preserving a custom block via the token path', () => {
    const result = importMarkdown(
      'hello **world**\n\n```mermaid\ngraph TD\n```',
      registry,
    );
    const [paragraph, diagram] = result.doc.content ?? [];
    expect(paragraph?.content?.[1]?.marks?.[0]?.type).toBe('bold');
    expect(diagram?.type).toBe('mermaid');
    expect(diagram?.attrs?.source).toBe('graph TD');
  });

  it('reports unmappable content instead of silently dropping it', () => {
    const result = importMarkdown('| a | b |\n| - | - |\n| 1 | 2 |', registry);
    expect(result.dropped.some((d) => d.source === 'table')).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('drops nodes whose attributes fail Zod validation on import', () => {
    const report: ImportReport = { warnings: [], dropped: [] };
    const doc = validateDoc(
      { type: 'doc', content: [{ type: 'mermaid', attrs: { source: 123 } }] },
      registry,
      report,
    );
    expect(doc.content).toHaveLength(0);
    expect(report.dropped[0]?.source).toBe('mermaid');
  });

  it('registers a codec for a new named format without touching the core', () => {
    const custom = createCodecRegistry([bold]);
    custom.registerNodeSerializer('bbcode', 'paragraph', (node, ctx) => {
      const c = ctx as SerializeContext;
      return `[p]${c.serializeChildren(node)}[/p]`;
    });
    const out = serialize(
      {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        ],
      },
      'bbcode',
      custom,
    );
    expect(out).toBe('[p]hi[/p]');
  });
});
