// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '../../document/core/types/index.js';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import { choice, lanes, link, plainText, richText } from '../../template/email/fields.js';
import { emailBlockCodec } from './email-block-codec.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import type { EditorEmailBlock } from './types.js';

const quote = defineEmailBlock({
  type: 'quote',
  label: 'Quote',
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
const codecs = [emailBlockCodec(quote.editor), emailBlockCodec(pair.editor)];

describe("a product block's email codec", () => {
  it('reads a stored block into its node and back unchanged', () => {
    const stored: EditorEmailBlock[] = [
      {
        id: 'q1',
        key: 'k1',
        type: 'quote',
        attributes: { tone: 'brand' },
        content: { text: '**Hi** {{name}} [a](https://x.test)', author: 'Lan', href: '{{u}}' },
      },
    ];
    const doc = fromEmailBlocks(stored, codecs);
    expect(doc.content?.[0]).toMatchObject({
      type: 'email_quote',
      attrs: { id: 'q1', key: 'k1', tone: 'brand', author: 'Lan', href: '{{u}}' },
    });
    expect(toEmailBlocks(doc, codecs)).toEqual(stored);
  });

  it('exports an unset attribute as absent and an empty field as empty', () => {
    const doc: DocJSON = { type: 'doc', content: [{ type: 'email_quote', attrs: { id: null, key: 'k', tone: null } }] };
    expect(toEmailBlocks(doc, codecs)).toEqual([
      { id: null, key: 'k', type: 'quote', attributes: {}, content: { text: '', author: '', href: '' } },
    ]);
  });

  it('keeps the body of a block of no lanes that a stored copy gives lanes', () => {
    const stored: EditorEmailBlock = {
      id: 'q1',
      key: 'q1',
      type: 'quote',
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
    expect(doc.content?.[0].content?.map((lane) => lane.type)).toEqual(['emailLane', 'emailLane']);
    expect(toEmailBlocks(doc, codecs)).toEqual(stored);
  });
});
