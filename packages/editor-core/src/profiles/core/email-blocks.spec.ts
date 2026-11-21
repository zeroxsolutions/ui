import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeCodec } from '../../document/core/types/index.js';
import { sameBlockContent } from '../../template/email/index.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import { TRAVEL_DEFAULT_BLOCKS } from './fixtures/travel-defaults.fixture.js';
import type { EditorEmailBlock } from './types.js';

function block(overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock {
  return { id: null, key: 'k', attributes: {}, content: {}, ...overrides };
}

describe('email blocks', () => {
  it('round-trips every travel default', () => {
    expect(TRAVEL_DEFAULT_BLOCKS.length).toBeGreaterThan(100);
    const back = toEmailBlocks(fromEmailBlocks(TRAVEL_DEFAULT_BLOCKS));
    expect(back).toHaveLength(TRAVEL_DEFAULT_BLOCKS.length);
    back.forEach((got, index) => {
      const want = TRAVEL_DEFAULT_BLOCKS[index];
      expect(got.id).toBe(want.id);
      expect(got.key).toBe(want.key);
      expect(got.lanes).toEqual(want.lanes);
      expect(got.attributes).toEqual(want.attributes);
      expect(sameBlockContent(got.content, want.content)).toBe(true);
    });
  });

  it('round-trips every kind, lanes and ids included, and makes no default explicit', () => {
    const blocks: EditorEmailBlock[] = [
      block({ id: 'a', key: 'a', type: 'paragraph', attributes: { tone: 'muted' }, content: { text: 'Hi {{name}}' } }),
      block({ id: 'b', type: 'callout', content: { text: '**Note**' } }),
      block({ type: 'list', content: { items: ['one', '_two_ {{x}}'] } }),
      block({ type: 'button', attributes: { width: 'full' }, content: { label: 'Go', href: '{{u}}' } }),
      block({ type: 'code', content: { code: '{{code}}' } }),
      block({ type: 'html', content: { html: '<p>{{a}}</p>' } }),
      block({ type: 'divider' }),
      block({
        id: 'c',
        type: 'columns',
        attributes: { ratio: [1, 2] },
        lanes: [[block({ id: 'l1', type: 'paragraph', content: { text: 'left' } })], []],
      }),
    ];
    expect(toEmailBlocks(fromEmailBlocks(blocks))).toEqual(blocks);
  });

  it('writes marks as markup', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: null, key: 'p' },
          content: [
            { type: 'text', text: 'a', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' ' },
            { type: 'text', text: 'b', marks: [{ type: 'italic' }] },
            { type: 'text', text: ' ' },
            { type: 'text', text: 'c', marks: [{ type: 'emailLink', attrs: { variable: 'u' } }] },
          ],
        },
      ],
    };
    expect(toEmailBlocks(doc)[0].content).toEqual({ text: '**a** _b_ [c]({{u}})' });
  });

  it('reads markup into marks', () => {
    const doc = fromEmailBlocks([block({ type: 'paragraph', content: { text: '**a** _b_ [c]({{u}}) {{n}}' } })]);
    expect(doc.content?.[0].content).toEqual([
      { type: 'text', text: 'a', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'b', marks: [{ type: 'italic' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'c', marks: [{ type: 'emailLink', attrs: { variable: 'u' } }] },
      { type: 'text', text: ' ' },
      { type: 'variable', attrs: { name: 'n' } },
    ]);
  });

  it('keeps a literal star by escaping it', () => {
    const blocks = [block({ type: 'paragraph', content: { text: '2 \\* 3 \\_x\\_' } })];
    const doc = fromEmailBlocks(blocks);
    expect(doc.content?.[0].content).toEqual([{ type: 'text', text: '2 * 3 _x_' }]);
    expect(toEmailBlocks(doc)).toEqual(blocks);
  });

  it('a custom node with an email codec round-trips', () => {
    const quote: NodeCodec = {
      node: 'quote',
      toEmailBlock: (node) => ({
        id: null,
        key: String(node.attrs?.key),
        type: 'quote',
        attributes: {},
        content: { text: String(node.attrs?.text) },
      }),
      fromEmailBlock: (b) =>
        b.type === 'quote' ? { type: 'quote', attrs: { key: b.key, text: String(b.content.text) } } : null,
    };
    const blocks = [block({ key: 'q', type: 'quote', content: { text: 'hello' } })];
    const doc = fromEmailBlocks(blocks, [quote]);
    expect(doc.content?.[0].type).toBe('quote');
    expect(toEmailBlocks(doc, [quote])).toEqual(blocks);
  });

  it('a block type with no codec imports as unknown-block-type content kept, not dropped', () => {
    const blocks = [block({ id: 'x', key: 'x', type: 'quote', attributes: { a: 1 }, content: { text: 'hello' } })];
    const doc = fromEmailBlocks(blocks);
    expect(doc.content?.[0].type).toBe('emailUnknown');
    expect(doc.content?.[0].attrs?.block).toEqual(blocks[0]);
    expect(toEmailBlocks(doc)).toEqual(blocks);
  });
});
