// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emailBlockCodec } from '../profiles/core/email-block-codec.js';
import { BlockDefinitionInvalid, defineEmailBlock } from '../template/email/define-email-block.js';
import { choice, items, lanes, link, plainText, richText } from '../template/email/fields.js';
import { FIXTURE_LAYOUT_PROPS } from '../template/email/fixtures.fixture.js';
import { createEmailRenderer } from '../template/email/renderer.js';
import { defineBlock, type BlockOptions } from './define-block.js';

const fields = { text: richText(), author: plainText({ max: 40 }), href: link() };
const attributes = { tone: choice(['plain', 'loud'], 'plain') };
const email = {
  render: (
    view: { fields: { text: string; author: string; href: string }; attributes: { tone: string } },
    h: Parameters<Parameters<typeof defineEmailBlock>[0]['render']>[1],
  ) =>
    h.section({ class: `zx-tone-${view.attributes.tone}` }, [
      h.text({ markup: view.fields.text }),
      h.text({ text: view.fields.author }),
    ]),
  sample: { fields: { text: '{{name}} said', author: 'Lan', href: '' }, variableTypes: { name: 'string' as const } },
};

describe('defineBlock', () => {
  it('builds, with an email side only, what defineEmailBlock builds', () => {
    const viaBlock = defineBlock({ type: 'saying', label: 'Saying', fields, attributes, email });
    const viaEmail = defineEmailBlock({ type: 'saying', label: 'Saying', fields, attributes, ...email });
    expect(viaBlock.email?.editor).toEqual(viaEmail.editor);
    expect(viaBlock.editor).toEqual(viaEmail.editor);
    expect(viaBlock.document).toBeNull();

    const input = {
      blocks: [{ id: 's', type: 'saying', attributes: { tone: 'loud' }, content: { text: '**Hi**', author: 'Lan' } }],
      subject: 's',
      preheader: null,
      locale: 'en',
      variables: {},
      variableTypes: {},
      layoutProps: FIXTURE_LAYOUT_PROPS,
    };
    const drawn = (definition: NonNullable<typeof viaBlock.email>) =>
      createEmailRenderer({ extraBlocks: [definition] }).render(input);
    expect(drawn(viaBlock.email!)).toEqual(drawn(viaEmail));
    for (const content of [{ text: 'x' }, { text: '' }, { text: 'x', author: 'y'.repeat(41) }]) {
      expect(viaBlock.email!.content.safeParse(content).success).toBe(viaEmail.content.safeParse(content).success);
    }
  });

  it('names one node for both editors when it has both sides', () => {
    const block = defineBlock({
      type: 'saying',
      label: 'Saying',
      fields,
      attributes,
      email,
      document: { html: (view, markup) => markup`<p>${view.fields.author}</p>${view.body}` },
    });
    expect(block.editor.node).toBe('saying');
    expect(block.email?.editor.node).toBe('saying');
    expect(block.document?.node.name).toBe('saying');
    expect(block.document?.node.content).toBe('inline*');
    expect(emailBlockCodec(block.editor).node).toBe('saying');
  });

  it('describes a document-only block to an editor, with no email side', () => {
    const block = defineBlock({
      type: 'linkCard',
      label: 'Link card',
      fields: { url: link({ required: true }), tags: items({ fields: { name: plainText() }, max: 3 }) },
      document: { html: (view, markup) => markup`<a href="${markup.url(view.fields.url)}">${view.fields.url}</a>` },
    });
    expect(block.email).toBeNull();
    expect(block.editor.node).toBe('linkCard');
    expect(block.editor.body).toBeNull();
    expect(block.editor.items.map((entry) => entry.name)).toEqual(['tags']);
    expect(block.document?.node).toMatchObject({ name: 'linkCard', group: 'block', atom: true });
  });

  it.each([
    [{ document: undefined, email: undefined }, 'it has neither a document nor an email side'],
    [{ fields: { sides: lanes({ min: 2, max: 2 }) } }, 'a document block holds no lanes field'],
    [{ type: 'image' }, 'the type names a Document Editor node'],
    [{ type: 'columns' }, 'the type names a Document Editor node'],
    [{ type: 'variable' }, 'the type names a Document Editor node'],
    [{ type: 'emailButton' }, 'the type names a Document Editor node'],
    [{ type: 'mathBlock' }, 'the type names a Document Editor node'],
    [{ type: 'Card' }, 'the type must be a lower-case letter, then letters and digits'],
    [{ fields: { id: plainText() } }, '"id" cannot name a field or an attribute'],
    [{ fields: { a: richText(), b: richText() } }, 'it holds more than one rich text field'],
  ])('refuses %o at definition', (overrides, reason) => {
    const options = {
      type: 'thing',
      label: 'Thing',
      fields: {},
      document: { html: () => ({ html: '' }) },
      ...overrides,
    } as unknown as BlockOptions<string, Record<string, never>, Record<string, never>>;
    expect(() => defineBlock(options)).toThrow(new BlockDefinitionInvalid(options.type, reason));
  });

  it('refuses an email side as defineEmailBlock does', () => {
    expect(() =>
      defineBlock({
        type: 'paragraph',
        label: 'P',
        fields: {},
        email: { ...email, sample: { fields: {}, variableTypes: {} } },
      } as never),
    ).toThrow(new BlockDefinitionInvalid('paragraph', 'the type is a default block type'));
  });
});
