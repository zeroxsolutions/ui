import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import type {
  CommandDescriptor,
  DocJSON,
  EditorFeature,
  NodeSpec,
} from './index.js';

/**
 * Smoke tests for the frozen public contract. These assert the *design intent*
 * that types alone can't: that a command's Zod schema actually gates its
 * arguments, that a node's attribute type derives from its schema (with
 * defaults), and that one `EditorFeature` literal can bundle all four facets —
 * all authored importing only this package (no engine type in sight).
 */
describe('frozen editor contract', () => {
  it('models a block document as canonical JSON', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    };
    expect(doc.type).toBe('doc');
    expect(doc.content?.[0]?.content?.[0]?.text).toBe('hi');
  });

  it('validates command arguments through the descriptor Zod schema', () => {
    const setHeading: CommandDescriptor<{ level: number }> = {
      args: z.object({ level: z.number().int().min(1).max(3) }),
      run: () => true,
    };
    expect(setHeading.args?.safeParse({ level: 2 }).success).toBe(true);
    expect(setHeading.args?.safeParse({ level: 9 }).success).toBe(false);
  });

  it('derives a node attribute type (with defaults) from its Zod schema', () => {
    const attrs = z.object({ src: z.string(), alt: z.string().default('') });
    const image: NodeSpec<z.infer<typeof attrs>> = {
      name: 'image',
      group: 'block',
      atom: true,
      attrs,
      // `attrs.src`/`attrs.alt` are statically typed `string` here.
      render: ({ attrs: a }) => `${a.src}|${a.alt}`,
    };
    const parsed = image.attrs?.parse({ src: 'https://x/y.png' });
    expect(parsed).toEqual({ src: 'https://x/y.png', alt: '' });
  });

  it('bundles edit + serialize + read + UI facets in one feature literal', () => {
    const feature: EditorFeature = {
      id: 'demo',
      nodes: [{ name: 'demo', group: 'block' }],
      commands: { insertDemo: { run: () => true } },
      slash: [{ id: 'demo', title: 'Demo', command: 'insertDemo' }],
      codecs: [{ node: 'demo', toMarkdown: () => ':demo:' }],
    };
    expect(feature.id).toBe('demo');
    expect(feature.slash?.[0]?.command).toBe('insertDemo');
    expect(feature.codecs?.[0]?.node).toBe('demo');
  });
});
