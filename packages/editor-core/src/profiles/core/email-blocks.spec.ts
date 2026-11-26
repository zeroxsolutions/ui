import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import { docProblems } from './doc-problems.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import { MAIL_LAYOUT_KINDS } from './profile.js';
import { TRAVEL_DEFAULT_BLOCKS } from './fixtures/travel-defaults.fixture.js';
import type { EditorEmailBlock } from './types.js';

/** A mail layout's kinds, which carry no heading or quote. */
const LAYOUT = { kinds: MAIL_LAYOUT_KINDS };

function block(overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock {
  return { id: null, key: 'k', attributes: {}, content: {}, ...overrides };
}

describe('email blocks', () => {
  it('round-trips every kind, lanes and ids included, and makes no default explicit', () => {
    const blocks: EditorEmailBlock[] = [
      block({
        id: 'a',
        key: 'a',
        type: 'paragraph',
        attributes: { tone: 'muted', align: 'center', spaceAfter: 'large' },
        content: { text: 'Hi {{name}}' },
      }),
      block({
        id: 'b',
        type: 'callout',
        attributes: { align: 'right', spaceAfter: 'small' },
        content: { text: '**Note**' },
      }),
      block({ type: 'list', content: { items: ['one', '_two_ {{x}}'] } }),
      block({ type: 'button', attributes: { width: 'full' }, content: { label: 'Go', href: '{{u}}' } }),
      block({ type: 'code', content: { code: '{{code}}' } }),
      block({ type: 'html', content: { html: '<p>{{a}}</p>' } }),
      block({ type: 'divider', attributes: { spaceAfter: 'small' } }),
      block({
        id: 'c',
        type: 'columns',
        attributes: { ratio: [1, 2] },
        lanes: [[block({ id: 'l1', type: 'paragraph', content: { text: 'left' } })], []],
      }),
    ];
    expect(toEmailBlocks(fromEmailBlocks(blocks))).toEqual(blocks);
  });

  it.each(['C:\\path', 'a]b', '_**a**_', '[**a**]({{u}})', '[a]({{u}})[b]({{u}})', '**open'])(
    'exports the stored text %s unchanged when nothing was edited',
    (text) => {
      const blocks = [
        block({ type: 'paragraph', content: { text } }),
        block({ type: 'callout', content: { text } }),
        block({ type: 'list', content: { items: [text, text] } }),
      ];
      expect(toEmailBlocks(fromEmailBlocks(blocks))).toEqual(blocks);
    },
  );

  it('reprints a field that was edited', () => {
    const doc = fromEmailBlocks([block({ type: 'paragraph', content: { text: '_**a**_' } })]);
    const node = doc.content![0];
    node.content = [...node.content!, { type: 'text', text: '*' }];
    expect(toEmailBlocks(doc)[0].content).toEqual({ text: '**_a_**\\*' });
    expect(toEmailBlocks(doc)[0].attributes).toEqual({});
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
            { type: 'text', text: 'c', marks: [{ type: 'emailLink', attrs: { href: '{{u}}' } }] },
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
      { type: 'text', text: 'c', marks: [{ type: 'emailLink', attrs: { href: '{{u}}' } }] },
      { type: 'text', text: ' ' },
      { type: 'variable', attrs: { name: 'n' } },
    ]);
  });

  it('reads a stored link mark that names a variable as an href holding that token', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: null, key: 'p' },
          content: [{ type: 'text', text: 'c', marks: [{ type: 'emailLink', attrs: { variable: 'u' } }] }],
        },
      ],
    };
    expect(toEmailBlocks(doc)[0].content).toEqual({ text: '[c]({{u}})' });
  });

  it('joins the nodes under one fixed href into one link, a token among them', () => {
    const href = 'https://x.test/?t={{token}}';
    const blocks = [block({ type: 'paragraph', content: { text: `[Go **now** {{n}}](${href}) [x](https://y.test)` } })];
    const doc = fromEmailBlocks(blocks);
    const link = [{ type: 'emailLink', attrs: { href } }];
    expect(doc.content?.[0].content).toEqual([
      { type: 'text', text: 'Go ', marks: link },
      { type: 'text', text: 'now', marks: [{ type: 'bold' }, ...link] },
      { type: 'text', text: ' ', marks: link },
      { type: 'variable', attrs: { name: 'n' }, marks: link },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'x', marks: [{ type: 'emailLink', attrs: { href: 'https://y.test' } }] },
    ]);
    expect(toEmailBlocks(doc)).toEqual(blocks);
  });

  it('round-trips every travel default byte for byte', () => {
    expect(toEmailBlocks(fromEmailBlocks(TRAVEL_DEFAULT_BLOCKS))).toEqual(TRAVEL_DEFAULT_BLOCKS);
  });

  it('keeps a literal star by escaping it', () => {
    const blocks = [block({ type: 'paragraph', content: { text: '2 \\* 3 \\_x\\_' } })];
    const doc = fromEmailBlocks(blocks);
    expect(doc.content?.[0].content).toEqual([{ type: 'text', text: '2 * 3 _x_' }]);
    expect(toEmailBlocks(doc)).toEqual(blocks);
  });

  it('a custom node with an email codec round-trips', () => {
    const testimonial: NodeCodec = {
      node: 'testimonial',
      toEmailBlock: (node) => ({
        id: null,
        key: String(node.attrs?.key),
        type: 'testimonial',
        attributes: {},
        content: { text: String(node.attrs?.text) },
      }),
      fromEmailBlock: (b) =>
        b.type === 'testimonial' ? { type: 'testimonial', attrs: { key: b.key, text: String(b.content.text) } } : null,
    };
    const blocks = [block({ key: 'q', type: 'testimonial', content: { text: 'hello' } })];
    const doc = fromEmailBlocks(blocks, [testimonial]);
    expect(doc.content?.[0].type).toBe('testimonial');
    expect(toEmailBlocks(doc, [testimonial])).toEqual(blocks);
  });

  it('a block type with no codec imports as unknown-block-type content kept, not dropped', () => {
    const blocks = [
      block({ id: 'x', key: 'x', type: 'testimonial', attributes: { a: 1 }, content: { text: 'hello' } }),
    ];
    const doc = fromEmailBlocks(blocks);
    expect(doc.content?.[0].type).toBe('emailUnknown');
    expect(doc.content?.[0].attrs?.block).toEqual(blocks[0]);
    expect(toEmailBlocks(doc)).toEqual(blocks);
  });

  it('exports an unknown block under its node identity', () => {
    const doc = fromEmailBlocks([block({ id: 'x', key: 'x', type: 'testimonial', content: { text: 'hi' } })]);
    doc.content![0].attrs = { ...doc.content![0].attrs, id: 'copy', key: 'x-2' };
    expect(toEmailBlocks(doc)[0]).toMatchObject({
      id: 'copy',
      key: 'x-2',
      type: 'testimonial',
      content: { text: 'hi' },
    });
  });

  it('keeps a stored attribute from overwriting identity or content', () => {
    const doc = fromEmailBlocks([
      block({
        id: 'a',
        key: 'k',
        type: 'button',
        attributes: { id: 'z', label: 'z' },
        content: { label: 'Go', href: 'h' },
      }),
    ]);
    expect(doc.content![0].attrs).toMatchObject({ id: 'a', key: 'k', label: 'Go', href: 'h' });
  });

  describe("the document's own nodes", () => {
    const para = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });
    const docOf = (...content: NodeJSON[]): DocJSON => ({ type: 'doc', content });
    const only = (doc: DocJSON) => toEmailBlocks(doc)[0];

    it('reads a list as a bulletList of listItems holding one paragraph each', () => {
      const [list] = fromEmailBlocks([block({ type: 'list', content: { items: ['one', '_two_'] } })]).content!;
      expect(list.type).toBe('bulletList');
      expect(list.content?.map((item) => item.type)).toEqual(['listItem', 'listItem']);
      expect(list.content?.map((item) => item.content?.map((child) => child.type))).toEqual([
        ['paragraph'],
        ['paragraph'],
      ]);
      expect(list.content?.[0].content?.[0].attrs).toMatchObject({ source: 'one' });
    });

    it('reads a callout as an info callout holding one paragraph', () => {
      const [callout] = fromEmailBlocks([block({ type: 'callout', content: { text: 'Note' } })]).content!;
      expect(callout).toMatchObject({ type: 'callout', attrs: { variant: 'info' } });
      expect(callout.content).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'Note' }] }]);
    });

    it('reads code as a codeBlock keeping its text in the code attribute', () => {
      const [code] = fromEmailBlocks([block({ type: 'code', content: { code: '{{code}}' } })]).content!;
      expect(code).toMatchObject({ type: 'codeBlock', attrs: { language: 'text', code: '{{code}}' } });
      expect(code.content).toBeUndefined();
    });

    it('reads a button as the shared button node, its label and href as attributes', () => {
      const [button] = fromEmailBlocks([
        block({ type: 'button', attributes: { width: 'full' }, content: { label: 'Go', href: '{{u}}' } }),
      ]).content!;
      expect(button).toMatchObject({ type: 'button', attrs: { width: 'full', label: 'Go', href: '{{u}}' } });
    });

    it('reads columns as the shared columns node holding a column per lane', () => {
      const [columns] = fromEmailBlocks([
        block({ type: 'columns', attributes: { ratio: [1, 2] }, lanes: [[block({ type: 'divider' })], []] }),
      ]).content!;
      expect(columns).toMatchObject({ type: 'columns', attrs: { ratio: [1, 2] } });
      expect(columns.content?.map((lane) => lane.type)).toEqual(['column', 'column']);
    });

    it('reads a divider as a horizontalRule', () => {
      expect(fromEmailBlocks([block({ type: 'divider' })]).content?.[0].type).toBe('horizontalRule');
    });

    it('exports a heading as a paragraph keeping its text where the kinds hold no heading', () => {
      const heading: NodeJSON = { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hi' }] };
      expect(toEmailBlocks(docOf(heading), [], LAYOUT)[0]).toMatchObject({
        type: 'paragraph',
        attributes: {},
        content: { text: 'Hi' },
      });
    });

    it('exports a blockquote as a paragraph joining its paragraphs with a space where the kinds hold no quote', () => {
      const testimonial: NodeJSON = { type: 'blockquote', content: [para('a'), para('b')] };
      expect(toEmailBlocks(docOf(testimonial), [], LAYOUT)[0]).toMatchObject({
        type: 'paragraph',
        content: { text: 'a b' },
      });
    });

    it('exports an orderedList as a list', () => {
      const ordered: NodeJSON = {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [para('a')] },
          { type: 'listItem', content: [para('b')] },
        ],
      };
      expect(only(docOf(ordered))).toMatchObject({ type: 'list', content: { items: ['a', 'b'] } });
    });

    it('exports a taskList as a list', () => {
      const tasks: NodeJSON = { type: 'taskList', content: [{ type: 'taskItem', content: [para('a')] }] };
      expect(only(docOf(tasks))).toMatchObject({ type: 'list', content: { items: ['a'] } });
    });

    it('exports a listItem holding two paragraphs as one item joined with a space', () => {
      const list: NodeJSON = { type: 'bulletList', content: [{ type: 'listItem', content: [para('a'), para('b')] }] };
      expect(only(docOf(list)).content).toEqual({ items: ['a b'] });
    });

    it('exports a nested list inside an item as part of that item', () => {
      const nested: NodeJSON = { type: 'bulletList', content: [{ type: 'listItem', content: [para('b')] }] };
      const list: NodeJSON = { type: 'bulletList', content: [{ type: 'listItem', content: [para('a'), nested] }] };
      expect(only(docOf(list)).content).toEqual({ items: ['a b'] });
    });
  });
});

describe('layout the email cannot draw', () => {
  it('exports justified text as left, and reports it', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { key: 'j', textAlign: 'justify' }, content: [{ type: 'text', text: 'x' }] },
      ],
    };
    expect(toEmailBlocks(doc)[0].attributes).toEqual({ align: 'left' });
    expect(docProblems(doc)).toEqual([{ kind: 'attributes-invalid', block: 'j', field: 'align' }]);
  });

  it('exports a full width image as no width and a full section as wide', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://x.test/a.png', alt: 'a', width: 'full' } },
        {
          type: 'section',
          attrs: { width: 'full' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
        },
      ],
    };
    expect(toEmailBlocks(doc).map((block) => block.attributes)).toEqual([{}, { width: 'wide' }]);
  });

  it('holds no px and no hex in an export', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://x.test/a.png', alt: 'a', width: 360, align: 'center' } },
        {
          type: 'table',
          attrs: { colwidth: [100, 300] },
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  attrs: { colwidth: [100] },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [
                { type: 'textColor', attrs: { token: 'teal' } },
                { type: 'textBackground', attrs: { token: 'amber' } },
              ],
            },
          ],
        },
      ],
    };
    const exported = JSON.stringify(toEmailBlocks(doc));
    expect(exported).not.toMatch(/\d+px/);
    expect(exported).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(toEmailBlocks(doc)[0].attributes).toEqual({ align: 'center', width: 0.5 });
  });
});
