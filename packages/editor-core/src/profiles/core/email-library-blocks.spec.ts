// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defaultBlocks, type DefaultBlockType } from '../../template/email/blocks/index.js';
import { docProblems } from './doc-problems.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import { EMAIL_BLOCK_NODES } from './email-nodes.js';
import { EMAIL_KINDS, emailProfile, MAIL_LAYOUT_KINDS } from './profile.js';
import type { EditorEmailBlock } from './types.js';
import { validate } from './validate.js';

const LIBRARY = ['spacer', 'socialLinks', 'hero', 'card', 'legalFooter'] as const;

const block = (
  type: string,
  content: Record<string, unknown>,
  attributes: Record<string, unknown> = {},
): EditorEmailBlock => ({ id: null, key: 'k1', type, attributes, content });

const feature = {
  image: 'https://x.test/h.png',
  alt: 'A bay',
  heading: 'Hello {{n}}',
  text: 'Come **soon**',
  buttonLabel: 'Go',
  buttonHref: '{{u}}',
};
const footer = { text: 'You joined.', address: '1 Road', unsubscribe: '{{u}}', unsubscribeLabel: '' };
const links = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    label: `Site ${index}`,
    icon: 'https://x.test/i.png',
    href: 'https://x.test',
  }));

/** One valid stored block of each library type. */
const STORED: readonly EditorEmailBlock[] = [
  block('spacer', {}, { height: 'large' }),
  block('socialLinks', { links: links(2) }, { align: 'center', size: 'small' }),
  block('hero', feature, { align: 'center' }),
  block('card', { ...feature, buttonLabel: '', buttonHref: '' }),
  block('legalFooter', footer),
];

const profile = emailProfile({
  variables: [
    { name: 'n', type: 'string' },
    { name: 'u', type: 'url' },
  ],
});

describe('the library kinds', () => {
  it('are email kinds with a document node each, and a mail layout holds none of them', () => {
    expect(EMAIL_KINDS).toEqual(expect.arrayContaining([...LIBRARY]));
    expect(EMAIL_BLOCK_NODES).toEqual(expect.arrayContaining([...LIBRARY]));
    for (const kind of LIBRARY) expect(MAIL_LAYOUT_KINDS).not.toContain(kind);
  });
});

describe('a library block through the email codec', () => {
  it('round-trips each stored block with no codec handed in, with and without kinds', () => {
    const doc = fromEmailBlocks(STORED);
    expect(doc.content?.map((node) => node.type)).toEqual([...LIBRARY]);
    expect(toEmailBlocks(doc)).toEqual(STORED);
    expect(toEmailBlocks(doc, [], { kinds: EMAIL_KINDS })).toEqual(STORED);
    expect(docProblems(doc)).toEqual([]);
  });

  it('holds the body as inline content, so a hero opens with its text editable', () => {
    const [hero] = fromEmailBlocks([STORED[2]]).content!;
    expect(hero.content).toEqual([
      { type: 'text', text: 'Come ' },
      { type: 'text', text: 'soon', marks: [{ type: 'bold' }] },
    ]);
  });
});

describe('validate a library block', () => {
  it('passes each stored block', () => {
    expect(validate(STORED, profile)).toEqual([]);
  });

  it.each([
    ['a button label without its link', block('hero', { ...feature, buttonHref: '' }), 'text-empty', 'buttonHref'],
    ['a button link without its label', block('card', { ...feature, buttonLabel: '' }), 'text-empty', 'buttonLabel'],
    ['a hero with no image', block('hero', { ...feature, image: '' }), 'text-empty', 'image'],
    ['an unsafe image', block('card', { ...feature, image: 'javascript:x' }), 'href-invalid', 'image'],
    ['a footer with no address', block('legalFooter', { ...footer, address: ' ' }), 'text-empty', 'address'],
    [
      'a footer with no unsubscribe link',
      block('legalFooter', { ...footer, unsubscribe: '' }),
      'text-empty',
      'unsubscribe',
    ],
    [
      'an unsafe unsubscribe link',
      block('legalFooter', { ...footer, unsubscribe: 'javascript:x' }),
      'href-invalid',
      'unsubscribe',
    ],
    ['no social links', block('socialLinks', { links: [] }), 'text-empty', 'links'],
    ['nine social links', block('socialLinks', { links: links(9) }), 'list-too-long', 'links'],
    ['a spacer height it does not take', block('spacer', {}, { height: 'huge' }), 'attributes-invalid', 'height'],
    ['a key the type does not have', block('spacer', { extra: 1 }), 'content-invalid', 'extra'],
  ])('flags %s', (_case, stored, kind, field) => {
    expect(validate([stored], profile)).toContainEqual(expect.objectContaining({ kind, field }));
  });

  it('agrees with the write check on each case', () => {
    const cases: EditorEmailBlock[] = [
      ...STORED,
      block('hero', { ...feature, buttonHref: '' }),
      block('card', { ...feature, buttonLabel: ' ' }),
      block('hero', { ...feature, alt: '' }),
      block('hero', { ...feature, image: 'mailto:a@b.c' }),
      block('legalFooter', { ...footer, address: '' }),
      block('legalFooter', { ...footer, unsubscribe: 'javascript:x' }),
      block('legalFooter', { ...footer, text: '**x' }),
      block('socialLinks', { links: links(9) }),
      block('socialLinks', { links: [{ ...links(1)[0], href: 'data:x' }] }),
      block('spacer', {}, { height: 'huge' }),
    ];
    for (const stored of cases) {
      const definition = defaultBlocks[stored.type as DefaultBlockType];
      const writes =
        definition.content.safeParse(stored.content).success &&
        definition.attributes.safeParse(stored.attributes).success;
      expect([stored, validate([stored], profile).length === 0]).toEqual([stored, writes]);
    }
  });
});
