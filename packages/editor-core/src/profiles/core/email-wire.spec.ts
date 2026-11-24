// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import { imageUrl, items, lanes, link, plainText, richText } from '../../template/email/fields.js';
import { emailBlockCodec } from './email-block-codec.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
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
