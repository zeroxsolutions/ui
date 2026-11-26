import { describe, expect, it } from 'vitest';
import { emailProfile, MAIL_LAYOUT_KINDS, smsProfile } from './profile.js';
import type { EditorEmailBlock, VariableDeclaration } from './types.js';
import { validate } from './validate.js';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import {
  choice,
  imageUrl,
  items,
  lanes,
  link,
  number,
  plainText,
  richText,
  toggle,
} from '../../template/email/fields.js';

const VARIABLES: VariableDeclaration[] = [
  { name: 'name', type: 'string' },
  { name: 'link', type: 'url' },
];

function block(type: string, content: Record<string, unknown>, extra: Partial<EditorEmailBlock> = {}) {
  return { id: null, key: 'k1', type, attributes: {}, content, ...extra } satisfies EditorEmailBlock;
}

const paragraph = (text: string) => block('paragraph', { text });
const profile = emailProfile({ variables: VARIABLES });

describe('validate an email', () => {
  it('flags a token naming no declaration', () => {
    expect(validate([paragraph('Hi {{x}}')], profile)).toEqual([
      { kind: 'variable-undeclared', block: 'k1', field: 'text', name: 'x' },
    ]);
  });

  it('names a block by its id when it has one', () => {
    expect(validate([{ ...paragraph('{{x}}'), id: 'b1' }], profile)).toEqual([
      { kind: 'variable-undeclared', block: 'b1', field: 'text', name: 'x' },
    ]);
  });

  it.each([
    ['empty', '', [{ kind: 'text-empty', block: 'k1', field: 'href' }]],
    ['only spaces', '   ', [{ kind: 'href-invalid', block: 'k1', field: 'href' }]],
    ['a fixed https url', 'https://x.test/a', []],
    ['a fixed http url', 'http://x.test/a', []],
    ['a fixed mailto address', 'mailto:a@x.test', []],
    ['a leading url token', '{{link}}', []],
    ['a leading url token with a path after it', ' {{link}}/a?b=1 ', []],
    ['a leading token that is not a url', '{{name}}', [{ kind: 'href-invalid', block: 'k1', field: 'href' }]],
    ['text before the scheme', 'Go https://x.test', [{ kind: 'href-invalid', block: 'k1', field: 'href' }]],
    ['a refused scheme', 'javascript:alert(1)', [{ kind: 'href-invalid', block: 'k1', field: 'href' }]],
    ['an inner token of any type', 'https://x.test/?n={{name}}&l={{link}}', []],
    [
      'an undeclared inner token',
      'https://x.test/?t={{x}}',
      [{ kind: 'variable-undeclared', block: 'k1', field: 'href', name: 'x' }],
    ],
    [
      'an undeclared leading token',
      '{{x}}/a',
      [{ kind: 'variable-undeclared', block: 'k1', field: 'href', name: 'x' }],
    ],
  ])('judges a button href that is %s', (_case, href, problems) => {
    expect(validate([block('button', { label: 'Go', href })], profile)).toEqual(problems);
  });

  it('flags an undeclared token in a button label', () => {
    expect(validate([block('button', { label: 'Go {{x}}', href: '{{link}}' })], profile)).toEqual([
      { kind: 'variable-undeclared', block: 'k1', field: 'label', name: 'x' },
    ]);
  });

  it('flags a list with no items', () => {
    expect(validate([block('list', { items: [] })], profile)).toEqual([
      { kind: 'text-empty', block: 'k1', field: 'items' },
    ]);
  });

  it('flags an invalid link href once per field', () => {
    expect(validate([paragraph('[a]({{name}}) [b]({{name}})')], profile)).toEqual([
      { kind: 'link-invalid', block: 'k1', field: 'text', name: 'name' },
    ]);
  });

  it.each([
    [
      'a leading token that is not a url',
      '[a]({{name}})',
      [{ kind: 'link-invalid', block: 'k1', field: 'text', name: 'name' }],
    ],
    ['empty', '[a]()', [{ kind: 'link-invalid', block: 'k1', field: 'text' }]],
    ['a refused scheme', '[a](javascript:x)', [{ kind: 'link-invalid', block: 'k1', field: 'text' }]],
    ['a fixed url', '[a](https://x.test/a)', []],
    ['a fixed url with an inner token', '[a](https://x.test/?n={{name}})', []],
    ['a leading url token', '[Continue {{name}}]({{link}}/a)', []],
    [
      'an undeclared inner token',
      '[a](https://x.test/?t={{x}})',
      [{ kind: 'variable-undeclared', block: 'k1', field: 'text', name: 'x' }],
    ],
    [
      'an undeclared leading token',
      '[a]({{x}})',
      [{ kind: 'variable-undeclared', block: 'k1', field: 'text', name: 'x' }],
    ],
  ])('judges a link href that is %s', (_case, text, problems) => {
    expect(validate([paragraph(text)], profile)).toEqual(problems);
  });

  it('flags a required variable no block prints', () => {
    const required = emailProfile({ variables: [{ name: 'name', type: 'string', required: true }] });
    expect(validate([paragraph('Hi')], required)).toEqual([
      { kind: 'required-variable-not-printed', block: null, name: 'name' },
    ]);
    expect(validate([paragraph('Hi {{name}}')], required)).toEqual([]);
  });

  it('counts a variable in a link target, in a lane and in a list item as printed', () => {
    const required = emailProfile({
      variables: [
        { name: 'link', type: 'url', required: true },
        { name: 'name', type: 'string', required: true },
      ],
    });
    const columns = block(
      'columns',
      {},
      {
        attributes: { ratio: [1, 1] },
        lanes: [[block('list', { items: ['[a]({{link}})'] })], [paragraph('{{name}}')]],
      },
    );
    expect(validate([columns], required)).toEqual([]);
  });

  it('flags unclosed markup with its offset', () => {
    expect(validate([paragraph('**a')], profile)).toEqual([
      { kind: 'markup-malformed', block: 'k1', field: 'text', offset: 0 },
    ]);
  });

  it('flags a block the profile does not allow', () => {
    const layout = emailProfile({ allow: MAIL_LAYOUT_KINDS });
    expect(validate([block('button', { label: 'Go', href: '{{link}}' })], layout)).toEqual([
      { kind: 'block-not-allowed', block: 'k1' },
    ]);
  });

  it('flags a block of a type no profile knows', () => {
    expect(validate([block('video', {})], profile)).toEqual([{ kind: 'unknown-block-type', block: 'k1' }]);
  });

  it('flags columns inside a lane', () => {
    const inner = block('columns', {}, { attributes: { ratio: [1, 1] }, lanes: [[], []] });
    const outer = block('columns', {}, { attributes: { ratio: [1, 1] }, lanes: [[inner], []] });
    expect(validate([outer], profile)).toEqual([{ kind: 'block-nested-too-deep', block: 'k1' }]);
  });

  it("flags a product's lanes block inside a lane, and checks the blocks in its own lanes", () => {
    const pairs = emailProfile({ variables: VARIABLES, extraKinds: ['pair'] });
    const inner = block('pair', {}, { lanes: [[], []] });
    const outer = block('columns', {}, { attributes: { ratio: [1, 1] }, lanes: [[inner], []] });
    expect(validate([outer], pairs)).toEqual([{ kind: 'block-nested-too-deep', block: 'k1' }]);
    const top = block('pair', {}, { lanes: [[block('video', {})], []] });
    expect(validate([top], pairs)).toEqual([{ kind: 'unknown-block-type', block: 'k1' }]);
  });

  it('flags a ratio that does not match the lanes', () => {
    const columns = block('columns', {}, { attributes: { ratio: [1, 1, 1] }, lanes: [[], []] });
    expect(validate([columns], profile)).toEqual([{ kind: 'lanes-mismatch', block: 'k1', field: 'ratio' }]);
  });

  it('flags empty text and an empty list item', () => {
    expect(validate([paragraph('')], profile)).toEqual([{ kind: 'text-empty', block: 'k1', field: 'text' }]);
    expect(validate([block('list', { items: ['a', ''] })], profile)).toEqual([
      { kind: 'text-empty', block: 'k1', field: 'items', item: 1 },
    ]);
  });

  it('flags text over the bound, markers counted', () => {
    expect(validate([paragraph('a'.repeat(5001))], profile)).toEqual([
      { kind: 'text-too-long', block: 'k1', field: 'text' },
    ]);
    expect(validate([paragraph(`**${'a'.repeat(4998)}**`)], profile)).toEqual([
      { kind: 'text-too-long', block: 'k1', field: 'text' },
    ]);
  });

  it('flags a list over its item bound', () => {
    const items = Array.from({ length: 21 }, () => 'a');
    expect(validate([block('list', { items })], profile)).toEqual([
      { kind: 'list-too-long', block: 'k1', field: 'items' },
    ]);
  });

  it('flags more blocks than the bound, lane children counted', () => {
    const many = Array.from({ length: 51 }, () => paragraph('a'));
    expect(validate(many, profile)).toEqual([{ kind: 'too-many-blocks', block: null }]);
    const lane = Array.from({ length: 49 }, () => paragraph('a'));
    const columns = block('columns', {}, { attributes: { ratio: [1, 1] }, lanes: [lane, [paragraph('a')]] });
    expect(validate([columns], profile)).toEqual([{ kind: 'too-many-blocks', block: null }]);
  });

  it('returns nothing for a valid email', () => {
    const lanes = [[paragraph('Left {{name}}')], [block('divider', {})]];
    const document = [
      paragraph('Hi **{{name}}**, [open]({{link}}) _now_'),
      block('button', { label: 'Go {{name}}', href: '{{link}}' }),
      block('code', { code: 'a = 1' }),
      block('list', { items: ['one', '**two**'] }),
      block('callout', { text: 'Careful' }),
      block('divider', {}),
      block('columns', {}, { attributes: { ratio: [1, 2] }, lanes }),
      block('html', { html: '<b>x</b>' }),
    ];
    expect(validate(document, profile)).toEqual([]);
  });
});

describe('validate an SMS body', () => {
  const sms = smsProfile({ variables: [{ name: 'name', type: 'string', required: true }] });
  const kinds = (body: string, p = sms) => validate(body, p).map((problem) => problem.kind);

  it('accepts a body that fits', () => {
    expect(validate('Hi {{name}}', sms)).toEqual([]);
  });

  it('flags 161 ASCII characters', () => {
    expect(kinds(`{{name}}${'a'.repeat(153)}`)).toContain('sms-segment-exceeded');
  });

  it('flags 71 characters once one leaves GSM-7', () => {
    expect(kinds(`{{name}}${'a'.repeat(63)}\u1EA1`)).toContain('sms-segment-exceeded');
  });

  it('counts each extension character as two units', () => {
    expect(kinds(`{{name}}${'{'.repeat(81)}`)).toContain('sms-segment-exceeded');
    expect(kinds(`{{name}}${'{'.repeat(74)}`)).not.toContain('sms-segment-exceeded');
    for (const c of '^{}\\[]~|') expect(kinds(`${'a'.repeat(79)}${c}{{name}}`)).not.toContain('sms-segment-exceeded');
    for (const c of '^{}\\[]~|') expect(kinds(`${'a'.repeat(159)}${c}`)).toContain('sms-segment-exceeded');
  });

  it('allows more segments when the profile does', () => {
    const long = smsProfile({ maxSegments: 2, variables: sms.variables });
    expect(kinds(`{{name}}${'a'.repeat(200)}`, long)).toEqual([]);
    expect(kinds(`{{name}}${'a'.repeat(400)}`, long)).toContain('sms-segment-exceeded');
  });

  it('flags a stray brace with its offset', () => {
    expect(validate('Hi {{name}', sms)).toContainEqual({ kind: 'sms-placeholder-malformed', block: null, offset: 3 });
    expect(validate('Hi {{name}} }}', sms)).toContainEqual({
      kind: 'sms-placeholder-malformed',
      block: null,
      offset: 12,
    });
    expect(validate('Hi }}{{name}}', sms)).toContainEqual({
      kind: 'sms-placeholder-malformed',
      block: null,
      offset: 3,
    });
  });

  it('flags an undeclared token and a required one not printed', () => {
    expect(validate('Hi {{x}}', sms)).toEqual([
      { kind: 'variable-undeclared', block: null, name: 'x' },
      { kind: 'required-variable-not-printed', block: null, name: 'name' },
    ]);
  });

  describe("validate a product's own block", () => {
    const card = defineEmailBlock({
      type: 'promo',
      label: 'Card',
      fields: { text: richText(), author: plainText({ max: 10 }), href: link(), image: imageUrl() },
      render: (_view, h) => h.divider(),
      sample: { fields: { text: 'x', author: 'y', href: '', image: '' }, variableTypes: {} },
    });
    const pair = defineEmailBlock({
      type: 'pair',
      label: 'Pair',
      fields: { sides: lanes({ min: 2, max: 2 }) },
      render: (_view, h) => h.divider(),
      sample: { fields: {}, variableTypes: {} },
    });
    const owned = emailProfile({ variables: VARIABLES, blocks: [card, pair] });
    const cardOf = (content: Record<string, unknown>) =>
      block('promo', { text: 'Hi', author: '', href: '', image: '', ...content });

    it("adds the blocks' kinds to the profile", () => {
      expect(owned.kinds).toEqual(expect.arrayContaining(['paragraph', 'promo', 'pair']));
      expect(validate([cardOf({ href: '{{link}}', image: 'https://x.test/a.png' })], owned)).toEqual([]);
    });

    it('flags what the renderer would refuse to save, in the kinds the default blocks use', () => {
      expect(validate([cardOf({ text: '' })], owned)).toEqual([{ kind: 'text-empty', block: 'k1', field: 'text' }]);
      expect(validate([cardOf({ text: '**Hi' })], owned)).toEqual([
        { kind: 'markup-malformed', block: 'k1', field: 'text', offset: 0 },
      ]);
      expect(validate([cardOf({ author: 'x'.repeat(11) })], owned)).toEqual([
        { kind: 'text-too-long', block: 'k1', field: 'author' },
      ]);
      expect(validate([cardOf({ href: '{{name}}' })], owned)).toEqual([
        { kind: 'href-invalid', block: 'k1', field: 'href' },
      ]);
      expect(validate([cardOf({ href: 'javascript:alert(1)' })], owned)).toEqual([
        { kind: 'href-invalid', block: 'k1', field: 'href' },
      ]);
      expect(validate([cardOf({ image: 'mailto:a@b.test' })], owned)).toEqual([
        { kind: 'href-invalid', block: 'k1', field: 'image' },
      ]);
      expect(validate([cardOf({ text: '[a](javascript:x) [b](javascript:x)' })], owned)).toEqual([
        { kind: 'link-invalid', block: 'k1', field: 'text' },
      ]);
      expect(validate([cardOf({ author: 5 })], owned)).toEqual([{ kind: 'text-empty', block: 'k1', field: 'author' }]);
      expect(validate([cardOf({ href: '{{nobody}}' })], owned)).toEqual([
        { kind: 'variable-undeclared', block: 'k1', field: 'href', name: 'nobody' },
      ]);
    });

    it('flags a lanes block holding fewer or more lanes than it takes', () => {
      expect(validate([block('pair', {}, { lanes: [[], []] })], owned)).toEqual([]);
      expect(validate([block('pair', {}, { lanes: [[], [], []] })], owned)).toEqual([
        { kind: 'lanes-count', block: 'k1', field: 'sides' },
      ]);
      expect(validate([block('pair', {}, { lanes: [[]] })], owned)).toEqual([
        { kind: 'lanes-count', block: 'k1', field: 'sides' },
      ]);
    });

    describe('with required fields and items', () => {
      const social = defineEmailBlock({
        type: 'social',
        label: 'Social',
        fields: {
          title: plainText({ required: true }),
          links: items({
            fields: { label: plainText({ required: true, max: 10 }), icon: imageUrl({ required: true }), href: link() },
            min: 1,
            max: 2,
          }),
        },
        render: (_view, h) => h.divider(),
        sample: { fields: { title: 't', links: [] }, variableTypes: {} },
      });
      const withSocial = emailProfile({ variables: VARIABLES, blocks: [social] });
      const entry = { label: 'Site', icon: 'https://x.test/i.png', href: '{{link}}' };
      const socialOf = (content: Record<string, unknown>) =>
        block('social', { title: 'T', links: [entry], ...content });

      it('flags an empty required field, and too few or too many items', () => {
        expect(validate([socialOf({})], withSocial)).toEqual([]);
        expect(validate([socialOf({ title: '' })], withSocial)).toEqual([
          { kind: 'text-empty', block: 'k1', field: 'title' },
        ]);
        expect(validate([socialOf({ links: [] })], withSocial)).toEqual([
          { kind: 'text-empty', block: 'k1', field: 'links' },
        ]);
        expect(validate([socialOf({ links: [entry, entry, entry] })], withSocial)).toEqual([
          { kind: 'list-too-long', block: 'k1', field: 'links' },
        ]);
      });

      it("flags each item's fields under the item's index", () => {
        expect(
          validate(
            [socialOf({ links: [entry, { label: 'x'.repeat(11), icon: 'mailto:a@b.test', href: '{{nobody}}' }] })],
            withSocial,
          ),
        ).toEqual([
          { kind: 'variable-undeclared', block: 'k1', field: 'links', item: 1, name: 'nobody' },
          { kind: 'text-too-long', block: 'k1', field: 'links', item: 1 },
          { kind: 'href-invalid', block: 'k1', field: 'links', item: 1 },
        ]);
        expect(validate([socialOf({ links: [{ ...entry, label: '' }] })], withSocial)).toEqual([
          { kind: 'text-empty', block: 'k1', field: 'links', item: 0 },
        ]);
        expect(validate([socialOf({ links: [entry, 'x'] })], withSocial)).toEqual([
          { kind: 'content-invalid', block: 'k1', field: 'links', item: 1 },
        ]);
        expect(validate([socialOf({ links: 'x' })], withSocial)).toEqual([
          { kind: 'content-invalid', block: 'k1', field: 'links' },
        ]);
        expect(validate([socialOf({ links: [{ ...entry, extra: 'x' }] })], withSocial)).toEqual([
          { kind: 'content-invalid', block: 'k1', field: 'links', item: 0 },
        ]);
        expect(validate([socialOf({ links: [{ ...entry, href: 'https://x.test\nBcc: a' }] })], withSocial)).toEqual([
          { kind: 'href-invalid', block: 'k1', field: 'links', item: 0 },
        ]);
      });

      it.each([
        { title: 'T', links: [entry] },
        { title: 'T', links: [entry, { label: 'B', icon: '{{link}}', href: '' }] },
        { title: 'T', links: [{ label: 'A', icon: 'https://x.test/a.png' }] },
        { title: '', links: [entry] },
        { title: 'T', links: [] },
        { title: 'T', links: [{ ...entry, icon: 'mailto:a@b.test' }] },
        { title: 'T', links: [{ ...entry, extra: 'x' }] },
        { title: 'T', links: [{ ...entry, label: 5 }] },
        { links: [entry] },
        { title: 'T', links: null },
        { title: '   ', links: [entry] },
        { title: 'T', links: [{ ...entry, label: '  ' }] },
        { title: 'T', links: [{ ...entry, href: '{{link' }] },
        { title: 'T', links: [{ ...entry, href: '{{ link }}' }] },
      ])('agrees with the write check on %o', (content) => {
        const clean = validate([block('social', content)], withSocial).length === 0;
        expect(clean).toBe(social.content.safeParse(content).success);
      });
    });

    it('refuses two blocks of one type', () => {
      expect(() => emailProfile({ blocks: [card, card] })).toThrow(/declared twice/);
    });
  });

  it('counts a token an html block spells with entities as not printed, as neither arm of the render prints it', () => {
    const required = emailProfile({ variables: [{ name: 'otp', type: 'string', required: true }] });
    const html = block('html', { html: '<p>Code: &#123;&#123;otp&#125;&#125;</p>' });
    expect(validate([html], required)).toEqual([{ kind: 'required-variable-not-printed', block: null, name: 'otp' }]);
  });

  describe("validate a block's content and attributes as the write check reads them", () => {
    it.each([
      [
        'an unknown key',
        { label: 'a', href: '{{link}}', extra: 'b' },
        [{ kind: 'content-invalid', block: 'k1', field: 'extra' }],
      ],
      ['an array', [], [{ kind: 'content-invalid', block: 'k1' }]],
      ['null', null, [{ kind: 'content-invalid', block: 'k1' }]],
      [
        'a parsed __proto__ key',
        JSON.parse('{"label":"a","href":"{{link}}","__proto__":"x"}') as Record<string, unknown>,
        [{ kind: 'content-invalid', block: 'k1', field: '__proto__' }],
      ],
    ])('reports %s on a button, and does not throw', (_case, content, expected) => {
      const button = { id: null, key: 'k1', type: 'button', attributes: {}, content } as unknown as EditorEmailBlock;
      expect(validate([button], profile).filter((problem) => problem.kind === 'content-invalid')).toEqual(expected);
    });

    it.each([
      ['a value its type does not take', { align: 'middle' }, [{ field: 'align' }]],
      ['a key its type does not have', { align: 'left', tone: 'muted' }, [{ field: 'tone' }]],
      ['attributes that are not an object', [], [{}]],
      ['no attributes', undefined, [{}]],
      ['attributes its type takes', { align: 'center', spaceAfter: 'large' }, []],
    ])("reports %s in a callout's attributes", (_case, attributes, expected) => {
      const callout = block('callout', { text: 'Hi' }, { attributes: attributes as Record<string, unknown> });
      expect(validate([callout], profile)).toEqual(
        expected.map((where) => ({ kind: 'attributes-invalid', block: 'k1', ...where })),
      );
    });

    it("leaves a columns block's ratio to lanes-mismatch", () => {
      const columns = block('columns', {}, { attributes: { ratio: [1, 99] }, lanes: [[], []] });
      expect(validate([columns], profile).map((problem) => problem.kind)).toEqual(['lanes-mismatch']);
    });

    it("reports a product block's attribute outside what it declares", () => {
      const owned = emailProfile({
        blocks: [
          defineEmailBlock({
            type: 'promo',
            label: 'Card',
            fields: { text: richText() },
            attributes: {
              tone: choice(['neutral', 'brand'], 'neutral'),
              bold: toggle(false),
              size: number({ min: 1, max: 3, default: 2 }),
            },
            render: (_view, h) => h.divider(),
            sample: { fields: { text: 'x' }, variableTypes: {} },
          }),
        ],
      });
      const card = (attributes: Record<string, unknown>) => block('promo', { text: 'Hi' }, { attributes });
      expect(validate([card({ tone: 'brand', bold: true, size: 2.5 })], owned)).toEqual([]);
      expect(validate([card({ tone: 'loud', bold: 'yes', size: 4, extra: 1 })], owned)).toEqual([
        { kind: 'attributes-invalid', block: 'k1', field: 'tone' },
        { kind: 'attributes-invalid', block: 'k1', field: 'bold' },
        { kind: 'attributes-invalid', block: 'k1', field: 'size' },
        { kind: 'attributes-invalid', block: 'k1', field: 'extra' },
      ]);
    });

    it("reports a key a product block's fields do not name", () => {
      const owned = emailProfile({
        blocks: [
          defineEmailBlock({
            type: 'promo',
            label: 'Card',
            fields: { text: richText() },
            render: (_view, h) => h.divider(),
            sample: { fields: { text: 'x' }, variableTypes: {} },
          }),
        ],
      });
      expect(validate([block('promo', { text: 'Hi', extra: 1 })], owned)).toEqual([
        { kind: 'content-invalid', block: 'k1', field: 'extra' },
      ]);
    });
  });
});

describe('validate sections and layout on the email wire', () => {
  const section = (lanes: EditorEmailBlock[][], attributes: Record<string, unknown> = {}, key = 's1') =>
    ({ ...block('section', {}, { attributes, lanes }), key }) satisfies EditorEmailBlock;
  const image = (attributes: Record<string, unknown>) =>
    block('image', { src: 'https://x.test/a.png', alt: 'A bay' }, { attributes });

  it('lets a section hold columns, a hero and a card', () => {
    const columns = block(
      'columns',
      {},
      { attributes: { ratio: [1, 1] }, lanes: [[paragraph('a')], [paragraph('b')]] },
    );
    const feature = { image: 'https://x.test/h.png', alt: 'A bay', heading: 'Hi', text: 'Welcome' };
    const hero = block('hero', feature);
    const card = block('card', feature);
    expect(validate([section([[columns, hero, card]])], profile)).toEqual([]);
  });

  it('reports a section in a lane as nested too deep', () => {
    const inner = section([[paragraph('a')]], {}, 'inner');
    const columns = block('columns', {}, { attributes: { ratio: [1, 1] }, lanes: [[inner], [paragraph('b')]] });
    expect(validate([columns], profile)).toEqual([{ kind: 'block-nested-too-deep', block: 'inner' }]);
  });

  it('reports a section in a section as nested too deep', () => {
    const inner = section([[paragraph('a')]], {}, 'inner');
    expect(validate([section([[inner]])], profile)).toEqual([{ kind: 'block-nested-too-deep', block: 'inner' }]);
  });

  it.each([
    ['no lane', []],
    ['two lanes', [[paragraph('a')], [paragraph('b')]]],
  ])('reports a section holding %s as lanes-count', (_case, lanes) => {
    expect(validate([section(lanes)], profile)).toEqual([{ kind: 'lanes-count', block: 's1' }]);
  });

  it.each([
    ['an image at full width', image({ width: 'full' }), 'width'],
    ['an image wider than the card', image({ width: 600 }), 'width'],
    ['a section at full width', section([[paragraph('a')]], { width: 'full' }, 'k1'), 'width'],
    ['a justified paragraph', block('paragraph', { text: 'a' }, { attributes: { align: 'justify' } }), 'align'],
    [
      'a section on a colour outside the set',
      section([[paragraph('a')]], { background: 'magenta' }, 'k1'),
      'background',
    ],
  ])('refuses what the email cannot draw: %s', (_case, refused, field) => {
    expect(validate([refused], profile)).toEqual([{ kind: 'attributes-invalid', block: 'k1', field }]);
  });

  it.each([
    ['a legacy pixel width', 283],
    ['a legacy pixel width under a quarter of the card', 48],
    ['a legacy width of one pixel', 1],
    ['a fraction', 0.5],
    ['a fraction off the drag step', 0.333],
  ])('takes an image width as %s', (_case, width) => {
    expect(validate([image({ width })], profile)).toEqual([]);
  });

  it.each([
    ['fewer widths than columns', [['a', 'b', 'c']], [0.5, 0.5]],
    ['more widths than columns', [['a', 'b']], [0.25, 0.25, 0.5]],
    ['widths that do not make the whole', [['a', 'b']], [0.3, 0.3]],
  ])('refuses a table with %s', (_case, rows, columnWidths) => {
    const table = block('table', { rows }, { attributes: { columnWidths } });
    expect(validate([table], profile)).toEqual([{ kind: 'attributes-invalid', block: 'k1', field: 'columnWidths' }]);
  });

  it('takes table widths that make the whole within rounding', () => {
    const table = block('table', { rows: [['a', 'b', 'c']] }, { attributes: { columnWidths: [0.33, 0.33, 0.33] } });
    expect(validate([table], profile)).toEqual([]);
  });

  it.each(['{color=red} alert', 'set {bg=x} here', 'a {/color} b', '{color=magenta}x{/color}'])(
    'takes text an older editor wrote with a literal brace: %j',
    (text) => {
      expect(validate([paragraph(text)], profile)).toEqual([]);
    },
  );

  it('takes the new attributes', () => {
    const document = [
      block('paragraph', { text: 'a' }, { attributes: { spaceBefore: 'none', spaceAfter: 'none', size: 'lead' } }),
      block(
        'columns',
        {},
        { attributes: { ratio: [1, 1], valign: 'center' }, lanes: [[paragraph('a')], [paragraph('b')]] },
      ),
      block('table', { rows: [['a', 'b']] }, { attributes: { columnWidths: [0.3, 0.7] } }),
      section([[paragraph('a')]], { background: 'teal', padding: 'large', width: 'wide', spaceBefore: 'small' }),
    ];
    expect(validate(document, profile)).toEqual([]);
  });
});
