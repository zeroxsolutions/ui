import { describe, expect, it } from 'vitest';
import { emailProfile, MAIL_LAYOUT_KINDS, smsProfile } from './profile.js';
import type { EditorEmailBlock, VariableDeclaration } from './types.js';
import { validate } from './validate.js';
import { defineEmailBlock } from '../../template/email/define-email-block.js';
import { imageUrl, lanes, link, plainText, richText } from '../../template/email/fields.js';

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
      type: 'card',
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
      block('card', { text: 'Hi', author: '', href: '', image: '', ...content });

    it("adds the blocks' kinds to the profile", () => {
      expect(owned.kinds).toEqual(expect.arrayContaining(['paragraph', 'card', 'pair']));
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
        { kind: 'lanes-mismatch', block: 'k1', field: 'sides' },
      ]);
      expect(validate([block('pair', {}, { lanes: [[]] })], owned)).toEqual([
        { kind: 'lanes-mismatch', block: 'k1', field: 'sides' },
      ]);
    });

    it('refuses two blocks of one type', () => {
      expect(() => emailProfile({ blocks: [card, card] })).toThrow(/declared twice/);
    });
  });
});
