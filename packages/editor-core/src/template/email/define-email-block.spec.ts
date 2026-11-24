// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { defineEmailBlock, BlockDefinitionInvalid } from './define-email-block.js';
import { choice, imageUrl, items, lanes, link, number, plainText, richText, toggle } from './fields.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { createEmailRenderer } from './renderer.js';
import { checkEmailRenderer } from './testing/index.js';

const quote = defineEmailBlock({
  type: 'quote',
  label: 'Quote',
  fields: { text: richText(), author: plainText({ max: 120 }) },
  attributes: {
    tone: choice(['neutral', 'brand'], 'neutral'),
    boxed: toggle(false),
    size: number({ min: 1, max: 3, default: 2 }),
  },
  render: ({ fields, attributes }, h) =>
    h.section(
      {
        class: ['zx-quote', `zx-tone-${attributes.tone}`, attributes.boxed && 'zx-boxed', `zx-size-${attributes.size}`],
      },
      [
        h.text({ class: 'zx-quote-text', markup: fields.text }),
        h.text({ class: 'zx-quote-author', text: fields.author }),
      ],
    ),
  sample: { fields: { text: '{{place}} changed my week.', author: 'Lan' }, variableTypes: { place: 'string' } },
});

const renderer = createEmailRenderer({
  theme: FIXTURE_THEME,
  extraBlocks: [quote],
  css: '.zx-quote-author{color:#123456}.zx-tone-brand .zx-quote-text{font-weight:600}',
});

function render(block: Omit<EmailBlock, 'id'>, variables: Record<string, string> = {}): { html: string; text: string } {
  return renderer.render({
    blocks: [{ id: 'q1', ...block }],
    subject: 's',
    preheader: null,
    locale: 'en',
    variables,
    variableTypes: { place: 'string', u: 'url' },
    layoutProps: { ...FIXTURE_LAYOUT_PROPS, footer: [] },
  });
}

describe('defineEmailBlock', () => {
  it('derives the strict write check from the fields and attributes', () => {
    expect(quote.content.safeParse({ text: 'Hi', author: 'Lan' }).success).toBe(true);
    expect(quote.content.safeParse({ text: '**Hi', author: 'Lan' }).success).toBe(false);
    expect(quote.content.safeParse({ text: 'Hi', author: 'x'.repeat(121) }).success).toBe(false);
    expect(quote.content.safeParse({ text: 'Hi', author: 'Lan', extra: 'x' }).success).toBe(false);
    expect(quote.content.safeParse({ text: 'Hi', author: '' }).success).toBe(true);
    // A field but the body left out reads as empty, as `validate` reads it.
    expect(quote.content.safeParse({ text: 'Hi' }).success).toBe(true);
    expect(quote.content.safeParse({ text: 'Hi', author: 5 }).success).toBe(false);
    // The editor's field holds one line; a stored newline draws as a space, and no check refuses it.
    expect(quote.content.safeParse({ text: 'Hi', author: 'Lan\nTran' }).success).toBe(true);
    expect(quote.attributes.safeParse({}).success).toBe(true);
    expect(quote.attributes.safeParse({ tone: 'brand', boxed: true, size: 3 }).success).toBe(true);
    expect(quote.attributes.safeParse({ tone: 'loud' }).success).toBe(false);
    expect(quote.attributes.safeParse({ size: 4 }).success).toBe(false);
    expect(quote.attributes.safeParse({ width: 'full' }).success).toBe(false);
  });

  it('reads a stored block leniently, a value it cannot read left to its default', () => {
    expect(quote.readContent({ text: 42 })).toEqual({ text: '', author: '' });
    expect(quote.readAttributes({ tone: 'loud', boxed: true })).toEqual({ boxed: true });
    expect(quote.holdsText).toBe(true);
    expect(quote.holdsLanes).toBe(false);
  });

  it('translates each rich and plain text field and copies a link', async () => {
    const banner = defineEmailBlock({
      type: 'banner',
      label: 'Banner',
      fields: { title: plainText(), href: link(), image: imageUrl() },
      render: ({ fields }, h) => h.image({ src: fields.image, alt: fields.title, width: 600, href: fields.href }),
      sample: {
        fields: { title: 'For {{name}}', href: '{{u}}', image: '{{u}}' },
        variableTypes: { name: 'string', u: 'url' },
      },
    });
    expect(banner.content.safeParse({ title: 'x', href: 'mailto:a@b.test', image: '{{u}}' }).success).toBe(true);
    expect(banner.content.safeParse({ title: 'x', href: 'javascript:alert(1)', image: '{{u}}' }).success).toBe(false);
    expect(banner.content.safeParse({ title: 'x', href: '{{u}}', image: 'mailto:a@b.test' }).success).toBe(false);
    await expect(
      banner.translate({ title: 'Hello', href: '{{u}}', image: '{{u}}' }, async (sentence) => `[${sentence}]`),
    ).resolves.toEqual({ title: '[Hello]', href: '{{u}}', image: '{{u}}' });
  });

  it('renders through the renderer in its own row, with a product sheet over its classes', () => {
    const { html, text } = render(
      {
        type: 'quote',
        attributes: { tone: 'brand', boxed: true },
        content: { text: '**{{place}}** changed it.', author: 'Lan' },
      },
      { place: 'Hue' },
    );
    expect(html).toContain('<td class="zx-block zx-block-quote zx-align-left zx-space-medium"');
    expect(html).toContain('<td class="zx-quote zx-tone-brand zx-boxed zx-size-2">');
    expect(html).toMatch(
      /class="zx-text zx-quote-text" style="[^"]*font-weight:600;"><strong>Hue<\/strong> changed it\./,
    );
    expect(html).toMatch(/class="zx-text zx-quote-author" style="[^"]*color:#123456;">Lan</);
    expect(text).toBe('Hue changed it.\n\nLan');
  });

  it('conforms: its values are escaped, it has a text twin, and the sheet warns of nothing', () => {
    expect(checkEmailRenderer(renderer, { layoutProps: FIXTURE_LAYOUT_PROPS })).toEqual([]);
  });

  it('draws its lanes through the same renderer', () => {
    const pair = defineEmailBlock({
      type: 'pair',
      label: 'Pair',
      fields: { sides: lanes({ min: 2, max: 2 }) },
      render: ({ fields }, h) =>
        h.columns(
          {},
          fields.sides.map((side) => h.column({}, side)),
        ),
      sample: {
        fields: {},
        variableTypes: { name: 'string' },
        lanes: [[{ id: 'l', type: 'paragraph', attributes: {}, content: { text: 'For {{name}}' } }], []],
      },
    });
    expect(pair.holdsLanes).toBe(true);
    const rendered = createEmailRenderer({ extraBlocks: [pair] }).render({
      blocks: [
        {
          id: 'p',
          type: 'pair',
          attributes: {},
          content: {},
          lanes: [
            [{ id: 'a', type: 'paragraph', attributes: {}, content: { text: 'Left' } }],
            [],
            [{ id: 'c', type: 'paragraph', attributes: {}, content: { text: 'Third' } }],
          ],
        },
      ],
      subject: 's',
      preheader: null,
      locale: 'en',
      variables: {},
      variableTypes: {},
      layoutProps: { ...FIXTURE_LAYOUT_PROPS, footer: [] },
    });
    expect(rendered.text).toBe('Left');
    expect(rendered.html.match(/class="zx-lane/g)).toHaveLength(2);
    expect(rendered.problems).toEqual([{ blockId: 'p', kind: 'lanes-count' }]);
  });

  it('describes the block to an editor, labels capitalised where none is given', () => {
    expect(quote.editor).toEqual({
      type: 'quote',
      node: 'email_quote',
      label: 'Quote',
      description: '',
      keywords: [],
      body: { name: 'text', label: 'Text', max: 5000 },
      fields: [{ name: 'author', kind: 'plainText', label: 'Author', max: 120, required: false }],
      items: [],
      lanes: null,
      attributes: [
        {
          name: 'tone',
          label: 'Tone',
          kind: 'choice',
          default: 'neutral',
          values: [
            { value: 'neutral', label: 'Neutral' },
            { value: 'brand', label: 'Brand' },
          ],
        },
        { name: 'boxed', label: 'Boxed', kind: 'toggle', default: false },
        { name: 'size', label: 'Size', kind: 'number', min: 1, max: 3, default: 2 },
      ],
    });
  });

  it.each([
    [{ type: 'paragraph' }, 'the type is a default block type'],
    [{ type: 'Quote' }, 'the type must be a lower-case letter, then letters and digits'],
    [{ fields: { id: plainText() } }, '"id" cannot name a field or an attribute'],
    [{ fields: { key: plainText() } }, '"key" cannot name a field or an attribute'],
    [{ fields: { a: richText(), b: richText() } }, 'it holds more than one rich text field'],
    [{ fields: { a: richText(), b: lanes({ min: 1, max: 2 }) } }, 'a lanes block holds no rich text field'],
    [
      { fields: { tone: plainText() }, attributes: { tone: toggle(false) } },
      '"tone" names both a field and an attribute',
    ],
    [{ attributes: { tone: choice(['a', 'b'], 'c' as 'a') } }, '"tone" defaults to a value it does not offer'],
    [{ attributes: { size: number({ min: 1, max: 3, default: 5 }) } }, '"size" defaults outside its range'],
    [{ fields: { sides: lanes({ min: 5, max: 9 }) } }, '"sides" holds at most 4 lanes'],
    [
      { fields: { links: items({ fields: { text: richText() } as never, max: 2 }) } },
      '"links" holds a field an item cannot',
    ],
    [
      { fields: { links: items({ fields: { more: items({ fields: {}, max: 1 }) } as never, max: 2 }) } },
      '"links" holds a field an item cannot',
    ],
    [{ fields: { links: items({ fields: { '1x': plainText() }, max: 2 }) } }, '"1x" cannot name a field of an item'],
    [{ fields: { links: items({ fields: {}, min: 3, max: 2 }) } }, '"links" needs 0 <= min <= max <= 20'],
    [{ fields: { links: items({ fields: {}, max: 21 }) } }, '"links" needs 0 <= min <= max <= 20'],
  ])('refuses %o at definition', (overrides, reason) => {
    expect(() =>
      defineEmailBlock({
        type: 'thing',
        label: 'Thing',
        fields: {},
        render: (_view, h) => h.divider(),
        sample: { fields: {}, variableTypes: {} },
        ...overrides,
      } as Parameters<typeof defineEmailBlock>[0]),
    ).toThrow(new BlockDefinitionInvalid((overrides as { type?: string }).type ?? 'thing', reason));
  });
});

describe('an items field', () => {
  const social = defineEmailBlock({
    type: 'social',
    label: 'Social',
    fields: {
      links: items({
        fields: {
          label: plainText({ required: true, max: 40 }),
          icon: imageUrl({ required: true }),
          href: link({ required: true }),
        },
        min: 1,
        max: 8,
      }),
    },
    render: ({ fields }, h) =>
      fields.links.map((entry) => h.image({ src: entry.icon, alt: entry.label, width: 24, href: entry.href })),
    sample: {
      fields: { links: [{ label: 'Site of {{name}}', icon: 'https://x.test/i.png', href: '{{site}}' }] },
      variableTypes: { name: 'string', site: 'url' },
    },
  });
  const entry = { label: 'Site', icon: 'https://x.test/i.png', href: 'https://x.test' };

  it('refuses on write a count outside its bounds, an unknown key and an address a client would not open', () => {
    const write = (links: unknown): boolean => social.content.safeParse({ links }).success;
    expect(write([entry])).toBe(true);
    expect(write([])).toBe(false);
    expect(write(Array.from({ length: 9 }, () => entry))).toBe(false);
    expect(write([{ ...entry, extra: 'x' }])).toBe(false);
    expect(write([{ ...entry, icon: 'javascript:x' }])).toBe(false);
    expect(write([{ ...entry, icon: 'mailto:a@b.test' }])).toBe(false);
    expect(write([{ ...entry, href: 'https://x.test\nBcc: a@b.test' }])).toBe(false);
    expect(write([{ ...entry, label: '' }])).toBe(false);
    expect(write([{ icon: entry.icon, href: entry.href }])).toBe(false);
    expect(write('x')).toBe(false);
    expect(social.content.safeParse({}).success).toBe(false);
  });

  it('reads a stored value leniently, an entry it cannot read as an item of empty text', () => {
    expect(social.readContent({ links: 'x' })).toEqual({ links: [] });
    expect(social.readContent({})).toEqual({ links: [] });
    expect(social.readContent({ links: [null, { label: 5, icon: 'i', href: 'h', extra: 'x' }] })).toEqual({
      links: [
        { label: '', icon: '', href: '' },
        { label: '', icon: 'i', href: 'h' },
      ],
    });
    expect(social.holdsText).toBe(true);
  });

  it("translates each item's plain text in order and copies its addresses", async () => {
    const seen: string[] = [];
    const translated = await social.translate({ links: [entry, { ...entry, label: 'Shop' }] }, async (sentence) => {
      seen.push(sentence);
      return `[${sentence}]`;
    });
    expect(seen).toEqual(['Site', 'Shop']);
    expect(translated).toEqual({
      links: [
        { ...entry, label: '[Site]' },
        { ...entry, label: '[Shop]' },
      ],
    });
  });

  it('hands the render the stored items, which it draws through the primitives', () => {
    const rendered = createEmailRenderer({ extraBlocks: [social] }).render({
      blocks: [
        { id: 's', type: 'social', attributes: {}, content: { links: [entry, { ...entry, href: 'javascript:x' }] } },
      ],
      subject: 's',
      preheader: null,
      locale: 'en',
      variables: {},
      variableTypes: {},
      layoutProps: { ...FIXTURE_LAYOUT_PROPS, footer: [] },
    });
    expect(rendered.html).toContain('<a href="https://x.test"');
    expect(rendered.html).not.toContain('javascript:');
    expect(
      checkEmailRenderer(createEmailRenderer({ extraBlocks: [social] }), { layoutProps: FIXTURE_LAYOUT_PROPS }),
    ).toEqual([]);
  });

  it('describes the items field and its sub-fields to an editor', () => {
    expect(social.editor.items).toEqual([
      {
        name: 'links',
        label: 'Links',
        min: 1,
        max: 8,
        fields: [
          { name: 'label', kind: 'plainText', label: 'Label', max: 40, required: true },
          { name: 'icon', kind: 'imageUrl', label: 'Icon', max: 2000, required: true },
          { name: 'href', kind: 'link', label: 'Href', max: 2000, required: true },
        ],
      },
    ]);
    expect(social.editor.fields).toEqual([]);
  });
});

describe('a required field', () => {
  const banner = (required: boolean) =>
    defineEmailBlock({
      type: 'banner',
      label: 'Banner',
      fields: { title: plainText({ required }), href: link({ required }), image: imageUrl({ required }) },
      render: (_view, h) => h.divider(),
      sample: {
        fields: { title: '{{name}}', href: 'https://x.test', image: 'https://x.test/a.png' },
        variableTypes: { name: 'string' },
      },
    });

  it('refuses on write an empty or missing value, which an optional one takes', () => {
    const full = { title: 'T', href: 'https://x.test', image: 'https://x.test/a.png' };
    expect(banner(true).content.safeParse(full).success).toBe(true);
    for (const name of ['title', 'href', 'image'] as const) {
      expect(banner(true).content.safeParse({ ...full, [name]: '' }).success).toBe(false);
      const { [name]: _left, ...missing } = full;
      expect(banner(true).content.safeParse(missing).success).toBe(false);
      expect(banner(false).content.safeParse(missing).success).toBe(true);
    }
    expect(banner(true).editor.fields.every((field) => field.required)).toBe(true);
  });
});
