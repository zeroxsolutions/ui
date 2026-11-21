import { describe, expect, it } from 'vitest';
import { emailProfile, MAIL_LAYOUT_KINDS } from './profile.js';
import type { EditorEmailBlock, VariableDeclaration } from './types.js';
import { validate } from './validate.js';

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

  it('flags a button href that is not one url variable', () => {
    const href = (value: string) => block('button', { label: 'Go', href: value });
    const problem = { kind: 'href-not-url-variable', block: 'k1', field: 'href' };
    expect(validate([href('{{name}}')], profile)).toEqual([problem]);
    expect(validate([href('https://x')], profile)).toEqual([problem]);
    expect(validate([href('{{link}}')], profile)).toEqual([]);
  });

  it('flags a link whose target is a declared variable that is not a url', () => {
    expect(validate([paragraph('[a]({{name}})')], profile)).toEqual([
      { kind: 'link-not-url-variable', block: 'k1', field: 'text', name: 'name' },
    ]);
  });

  it('reads a link target that is not one token as malformed', () => {
    expect(validate([paragraph('[a](https://x)')], profile)).toEqual([
      { kind: 'markup-malformed', block: 'k1', field: 'text', offset: 3 },
    ]);
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

  it('hands a string to the SMS half, which returns nothing yet', () => {
    expect(validate('Hi', profile)).toEqual([]);
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
