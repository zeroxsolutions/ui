// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import { imageUrl, items, lanes, link, plainText, richText } from '../../template/email/fields.js';
import { emailBlockCodec } from './email-block-codec.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import type { EditorEmailBlock } from './types.js';

const testimonial = defineEmailBlock({
  type: 'testimonial',
  label: 'Testimonial',
  fields: { text: richText(), author: plainText(), href: link() },
  render: (_view, h) => h.divider(),
  sample: { fields: { text: '{{a}}', author: 'b', href: 'https://x.test' }, variableTypes: { a: 'string' } },
});
const pair = defineEmailBlock({
  type: 'pair',
  label: 'Pair',
  fields: { sides: lanes({ min: 2, max: 2 }) },
  render: (_view, h) => h.divider(),
  sample: { fields: {}, variableTypes: {} },
});
const links = defineEmailBlock({
  type: 'links',
  label: 'Links',
  fields: { links: items({ fields: { label: plainText(), icon: imageUrl(), href: link() }, max: 8 }) },
  render: (_view, h) => h.divider(),
  sample: { fields: { links: [] }, variableTypes: {} },
});
const codecs = [emailBlockCodec(testimonial.editor), emailBlockCodec(pair.editor), emailBlockCodec(links.editor)];

const paragraph = (id: string, text: string): EditorEmailBlock => ({
  id,
  key: `k-${id}`,
  type: 'paragraph',
  attributes: {},
  content: { text },
});

/** One stored block of every type the email profile reads, each attribute set somewhere, lanes nested. */
const EVERY_BLOCK: EditorEmailBlock[] = [
  {
    id: 'p',
    key: 'kp',
    type: 'paragraph',
    attributes: { align: 'center', spaceAfter: 'large', tone: 'muted' },
    content: { text: 'Hi **{{name}}** [here]({{u}})' },
  },
  { id: 'c', key: 'kc', type: 'callout', attributes: { align: 'right' }, content: { text: '_Note_' } },
  { id: 'l', key: 'kl', type: 'list', attributes: { spaceAfter: 'small' }, content: { items: ['one', 'two {{x}}'] } },
  {
    id: 'b',
    key: 'kb',
    type: 'button',
    attributes: { align: 'center', spaceAfter: 'large', width: 'full' },
    content: { label: 'Go {{name}}', href: '{{u}}' },
  },
  { id: null, key: 'kb2', type: 'button', attributes: {}, content: { label: '', href: '' } },
  { id: 'k', key: 'kk', type: 'code', attributes: { align: 'center' }, content: { code: '{{code}}' } },
  { id: 'h', key: 'kh', type: 'html', attributes: { spaceAfter: 'small' }, content: { html: '<p>{{a}}</p>' } },
  { id: 'd', key: 'kd', type: 'divider', attributes: { spaceAfter: 'large' }, content: {} },
  {
    id: 'cols',
    key: 'kcols',
    type: 'columns',
    attributes: { ratio: [2, 1, 1], spaceAfter: 'small' },
    content: {},
    lanes: [
      [
        paragraph('a', 'left'),
        {
          id: 'lb',
          key: 'klb',
          type: 'button',
          attributes: { width: 'full' },
          content: { label: 'Go', href: '{{u}}' },
        },
      ],
      [],
      [{ id: 'lc', key: 'klc', type: 'callout', attributes: {}, content: { text: 'Note' } }],
    ],
  },
  {
    id: 't',
    key: 'kt',
    type: 'testimonial',
    attributes: {},
    content: { text: '**Hi** {{name}}', author: 'Lan', href: 'https://x.test' },
  },
  {
    id: 'pair',
    key: 'kpair',
    type: 'pair',
    attributes: {},
    content: {},
    lanes: [[paragraph('pl', 'left')], [paragraph('pr', 'right')]],
  },
  {
    id: 'links',
    key: 'klinks',
    type: 'links',
    attributes: {},
    content: { links: [{ label: 'X', icon: 'https://x.test/x.png', href: 'https://x.test' }] },
  },
  { id: 'u', key: 'ku', type: 'unheardOf', attributes: { a: 1 }, content: { b: 2 } },
];

describe('the stored email wire', () => {
  it('exports every stored block type byte for byte as it was before the shared button and columns nodes', () => {
    const exported = toEmailBlocks(fromEmailBlocks(EVERY_BLOCK, codecs), codecs);
    expect(JSON.stringify(exported)).toMatchInlineSnapshot(
      `"[{"id":"p","key":"kp","type":"paragraph","attributes":{"align":"center","spaceAfter":"large","tone":"muted"},"content":{"text":"Hi **{{name}}** [here]({{u}})"}},{"id":"c","key":"kc","type":"callout","attributes":{"align":"right"},"content":{"text":"_Note_"}},{"id":"l","key":"kl","type":"list","attributes":{"spaceAfter":"small"},"content":{"items":["one","two {{x}}"]}},{"id":"b","key":"kb","type":"button","attributes":{"align":"center","spaceAfter":"large","width":"full"},"content":{"label":"Go {{name}}","href":"{{u}}"}},{"id":null,"key":"kb2","type":"button","attributes":{},"content":{"label":"","href":""}},{"id":"k","key":"kk","type":"code","attributes":{"align":"center"},"content":{"code":"{{code}}"}},{"id":"h","key":"kh","type":"html","attributes":{"spaceAfter":"small"},"content":{"html":"<p>{{a}}</p>"}},{"id":"d","key":"kd","type":"divider","attributes":{"spaceAfter":"large"},"content":{}},{"id":"cols","key":"kcols","type":"columns","attributes":{"ratio":[2,1,1],"spaceAfter":"small"},"content":{},"lanes":[[{"id":"a","key":"k-a","type":"paragraph","attributes":{},"content":{"text":"left"}},{"id":"lb","key":"klb","type":"button","attributes":{"width":"full"},"content":{"label":"Go","href":"{{u}}"}}],[],[{"id":"lc","key":"klc","type":"callout","attributes":{},"content":{"text":"Note"}}]]},{"id":"t","key":"kt","type":"testimonial","attributes":{},"content":{"text":"**Hi** {{name}}","author":"Lan","href":"https://x.test"}},{"id":"pair","key":"kpair","type":"pair","attributes":{},"content":{},"lanes":[[{"id":"pl","key":"k-pl","type":"paragraph","attributes":{},"content":{"text":"left"}}],[{"id":"pr","key":"k-pr","type":"paragraph","attributes":{},"content":{"text":"right"}}]]},{"id":"links","key":"klinks","type":"links","attributes":{},"content":{"links":[{"label":"X","icon":"https://x.test/x.png","href":"https://x.test"}]}},{"id":"u","key":"ku","type":"unheardOf","attributes":{"a":1},"content":{"b":2}}]"`,
    );
  });
});

describe('layout and colour between the document and the wire', () => {
  const text = (value: string, marks: NodeJSON['marks'] = []): NodeJSON => ({
    type: 'text',
    text: value,
    ...(marks.length === 0 ? {} : { marks }),
  });
  const para = (value: string, attrs: Record<string, unknown> = {}): NodeJSON => ({
    type: 'paragraph',
    attrs,
    content: [text(value)],
  });
  const image = (attrs: Record<string, unknown>): NodeJSON => ({
    type: 'image',
    attrs: { src: 'https://x.test/a.png', alt: 'A bay', ...attrs },
  });
  const LAYOUT_KEYS = [
    'align',
    'width',
    'spaceBefore',
    'spaceAfter',
    'textAlign',
    'size',
    'valign',
    'ratio',
    'columnWidths',
    'background',
    'padding',
  ];
  /** The layout attributes of each node at any depth, in document order. */
  const layoutOf = (nodes: readonly NodeJSON[]): unknown[] =>
    nodes.flatMap((node) => [
      Object.fromEntries(LAYOUT_KEYS.flatMap((key) => (node.attrs?.[key] == null ? [] : [[key, node.attrs[key]]]))),
      ...layoutOf(node.content ?? []),
    ]);

  it('round-trips a document with every layout value through the wire, full width coming back as 1', () => {
    const content: NodeJSON[] = [
      para('Lead', { textAlign: 'center', size: 'lead', spaceBefore: 'none', spaceAfter: 'large', tone: 'muted' }),
      { type: 'heading', attrs: { level: 2, textAlign: 'end', spaceBefore: 'small' }, content: [text('Title')] },
      { type: 'blockquote', attrs: { spaceBefore: 'medium' }, content: [para('Quoted', { textAlign: 'center' })] },
      {
        type: 'bulletList',
        attrs: { spaceAfter: 'none' },
        content: [{ type: 'listItem', content: [para('one', { textAlign: 'end' })] }],
      },
      {
        type: 'callout',
        attrs: { variant: 'info', spaceBefore: 'large' },
        content: [para('Note', { textAlign: 'center' })],
      },
      image({ align: 'end', width: 0.5, spaceBefore: 'large' }),
      { type: 'codeBlock', attrs: { language: 'text', code: '123', align: 'center', spaceBefore: 'small' } },
      { type: 'button', attrs: { label: 'Go', href: '{{u}}', align: 'end', spaceBefore: 'small', width: 'full' } },
      { type: 'horizontalRule', attrs: { spaceBefore: 'none' } },
      { type: 'emailHtml', attrs: { spaceBefore: 'small' }, content: [text('<b>x</b>')] },
      {
        type: 'table',
        attrs: { columnWidths: [0.3, 0.7], spaceBefore: 'small' },
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [para('a')] },
              { type: 'tableCell', content: [para('b')] },
            ],
          },
        ],
      },
      {
        type: 'columns',
        attrs: { ratio: [8, 4], valign: 'center', spaceBefore: 'small' },
        content: [
          { type: 'column', content: [para('left')] },
          { type: 'column', content: [para('right')] },
        ],
      },
      {
        type: 'section',
        attrs: { background: 'teal', padding: 'large', width: 'wide', spaceAfter: 'small' },
        content: [para('inside', { textAlign: 'center' })],
      },
    ];
    const wire = toEmailBlocks({ type: 'doc', content: [...content, image({ width: 'full' })] });
    const back = fromEmailBlocks(wire);
    expect(toEmailBlocks(back)).toEqual(wire);
    expect(layoutOf(back.content ?? [])).toEqual(layoutOf([...content, image({ width: 1 })]));
  });

  it('reads an old wire with align right and width 283 as end and 0.5, and writes it back as right and 0.5', () => {
    const old: EditorEmailBlock[] = [
      {
        id: 'i',
        key: 'ki',
        type: 'image',
        attributes: { align: 'right', width: 283 },
        content: { src: 'https://x.test/a.png', alt: 'A' },
      },
      { id: 'p', key: 'kp', type: 'paragraph', attributes: { align: 'right' }, content: { text: 'Right' } },
    ];
    const doc = fromEmailBlocks(old);
    expect(doc.content?.[0].attrs).toMatchObject({ align: 'end', width: 0.5 });
    expect(doc.content?.[1].attrs).toMatchObject({ textAlign: 'end' });
    expect(doc.content?.[1].attrs).not.toHaveProperty('align');
    expect(toEmailBlocks(doc).map((block) => block.attributes)).toEqual([
      { align: 'right', width: 0.5 },
      { align: 'right' },
    ]);
  });

  it('exports a coloured bold run as a colour marker around the bold', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [text('x', [{ type: 'bold' }, { type: 'textColor', attrs: { token: 'red' } }])] },
      ],
    };
    expect(toEmailBlocks(doc)[0].content).toEqual({ text: '{color=red}**x**{/color}' });
    expect(fromEmailBlocks(toEmailBlocks(doc)).content?.[0].content?.[0].marks).toEqual([
      { type: 'bold' },
      { type: 'textColor', attrs: { token: 'red' } },
    ]);
  });

  it('exports a section holding columns as one section lane holding a columns block', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'section',
          attrs: { background: 'muted' },
          content: [
            {
              type: 'columns',
              attrs: { ratio: [1, 1] },
              content: [
                { type: 'column', content: [para('l')] },
                { type: 'column', content: [para('r')] },
              ],
            },
          ],
        },
      ],
    };
    const [section] = toEmailBlocks(doc);
    expect(section).toMatchObject({ type: 'section', attributes: { background: 'muted' }, content: {} });
    expect(section.lanes).toHaveLength(1);
    expect(section.lanes?.[0].map((block) => block.type)).toEqual(['columns']);
    expect(section.lanes?.[0][0].lanes?.map((lane) => lane.map((block) => block.content))).toEqual([
      [{ text: 'l' }],
      [{ text: 'r' }],
    ]);
  });
});
