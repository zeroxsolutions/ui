// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '../../document/core/types/index.js';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import { choice, imageUrl, items, lanes, link, plainText, richText } from '../../template/email/fields.js';
import { emailBlockCodec } from './email-block-codec.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import type { EditorEmailBlock } from './types.js';

const testimonial = defineEmailBlock({
  type: 'testimonial',
  label: 'Testimonial',
  fields: { text: richText(), author: plainText(), href: link() },
  attributes: { tone: choice(['neutral', 'brand'], 'neutral') },
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
const codecs = [emailBlockCodec(testimonial.editor), emailBlockCodec(pair.editor)];

describe("a product block's email codec", () => {
  it('reads a stored block into its node and back unchanged', () => {
    const stored: EditorEmailBlock[] = [
      {
        id: 'q1',
        key: 'k1',
        type: 'testimonial',
        attributes: { tone: 'brand' },
        content: { text: '**Hi** {{name}} [a](https://x.test)', author: 'Lan', href: '{{u}}' },
      },
    ];
    const doc = fromEmailBlocks(stored, codecs);
    expect(doc.content?.[0]).toMatchObject({
      type: 'email_testimonial',
      attrs: { id: 'q1', key: 'k1', tone: 'brand', author: 'Lan', href: '{{u}}' },
    });
    expect(toEmailBlocks(doc, codecs)).toEqual(stored);
  });

  it('exports an unset attribute as absent and an empty field as empty', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ type: 'email_testimonial', attrs: { id: null, key: 'k', tone: null } }],
    };
    expect(toEmailBlocks(doc, codecs)).toEqual([
      { id: null, key: 'k', type: 'testimonial', attributes: {}, content: { text: '', author: '', href: '' } },
    ]);
  });

  it('keeps the body of a block of no lanes that a stored copy gives lanes', () => {
    const stored: EditorEmailBlock = {
      id: 'q1',
      key: 'q1',
      type: 'testimonial',
      attributes: {},
      content: { text: 'Hi', author: '', href: '' },
      lanes: [],
    };
    const { lanes: _dropped, ...kept } = stored;
    expect(toEmailBlocks(fromEmailBlocks([stored], codecs), codecs)).toEqual([kept]);
  });

  it('carries the lanes of a lanes block both ways', () => {
    const stored: EditorEmailBlock[] = [
      {
        id: 'p1',
        key: 'p1',
        type: 'pair',
        attributes: {},
        content: {},
        lanes: [[{ id: 'a', key: 'a', type: 'paragraph', attributes: {}, content: { text: 'Left' } }], []],
      },
    ];
    const doc = fromEmailBlocks(stored, codecs);
    expect(doc.content?.[0].content?.map((lane) => lane.type)).toEqual(['column', 'column']);
    expect(toEmailBlocks(doc, codecs)).toEqual(stored);
  });
});

describe("a product block's items through its email codec", () => {
  const social = defineEmailBlock({
    type: 'social',
    label: 'Social',
    fields: { links: items({ fields: { label: plainText(), icon: imageUrl(), href: link() }, max: 8 }) },
    render: (_view, h) => h.divider(),
    sample: { fields: { links: [] }, variableTypes: {} },
  });
  const socialCodecs = [emailBlockCodec(social.editor)];

  it('reads stored items into the node and back unchanged', () => {
    const stored: EditorEmailBlock[] = [
      {
        id: 's1',
        key: 's1',
        type: 'social',
        attributes: {},
        content: { links: [{ label: 'Site', icon: 'https://x.test/i.png', href: '{{u}}' }] },
      },
    ];
    const doc = fromEmailBlocks(stored, socialCodecs);
    expect(doc.content?.[0]).toMatchObject({ type: 'email_social', attrs: { links: stored[0].content.links } });
    expect(toEmailBlocks(doc, socialCodecs)).toEqual(stored);
  });

  it('exports each item with every sub-field as text, whatever the node holds', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ type: 'email_social', attrs: { id: null, key: 'k', links: [{ label: 5, icon: 'i' }, null, 'x'] } }],
    };
    expect(toEmailBlocks(doc, socialCodecs)[0].content).toEqual({
      links: [
        { label: '', icon: 'i', href: '' },
        { label: '', icon: '', href: '' },
        { label: '', icon: '', href: '' },
      ],
    });
    const none: DocJSON = { type: 'doc', content: [{ type: 'email_social', attrs: { id: null, key: 'k' } }] };
    expect(toEmailBlocks(none, socialCodecs)[0].content).toEqual({ links: [] });
  });
});
