// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { card } from '../../blocks/card.js';
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
const footer = {
  sender: 'You joined.',
  reason: 'You asked for news.',
  address: '1 Road',
  unsubscribe: '{{u}}',
  unsubscribeLabel: '',
};
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
  it('are email kinds with a document node each, and a mail layout holds the legal footer alone', () => {
    expect(EMAIL_KINDS).toEqual(expect.arrayContaining([...LIBRARY]));
    expect(EMAIL_BLOCK_NODES).toEqual(expect.arrayContaining([...LIBRARY]));
    expect(LIBRARY.filter((kind) => MAIL_LAYOUT_KINDS.includes(kind))).toEqual(['legalFooter']);
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
      block('legalFooter', { ...footer, sender: '**x' }),
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

describe('a library block opened and saved unedited', () => {
  it.each([
    ['a hero with no button', block('hero', { image: feature.image, alt: 'a', heading: 'h', text: 't' })],
    [
      'a card whose keys are in another order',
      block('card', { text: 't', heading: 'h', alt: 'a', image: feature.image, buttonHref: '', buttonLabel: '' }),
    ],
    [
      'social links whose items keep their keys in another order',
      block('socialLinks', { links: [{ href: 'https://x.test', icon: 'https://x.test/i.png', label: 'Blog' }] }),
    ],
    [
      'a footer with no reason',
      block('legalFooter', { sender: 'You joined.', address: '1 Road', unsubscribe: '{{u}}' }),
    ],
  ])('saves %s byte for byte as stored', (_case, stored) => {
    const doc = fromEmailBlocks([stored]);
    expect(JSON.stringify(toEmailBlocks(doc))).toBe(JSON.stringify([stored]));
  });

  it('saves an edited one as the editor holds it', () => {
    const doc = fromEmailBlocks([block('hero', feature, { align: 'center' })]);
    doc.content![0].attrs = { ...doc.content![0].attrs, heading: 'Changed' };
    expect(toEmailBlocks(doc)[0].content).toMatchObject({ heading: 'Changed' });
  });
});

describe('a library block in a lane', () => {
  it.each(['hero', 'card'])('flags a %s, drawn too wide for a lane', (type) => {
    const columns: EditorEmailBlock = {
      ...block('columns', {}, { ratio: [1, 1] }),
      lanes: [[{ ...block(type, feature), key: 'k2' }], []],
    };
    expect(validate([columns], profile)).toContainEqual({ kind: 'block-nested-too-deep', block: 'k2' });
  });
});

describe('a library block image', () => {
  it.each([
    ['hero', block('hero', { ...feature, image: 'http://x.test/h.png' }), 'image'],
    ['social links', block('socialLinks', { links: [{ ...links(1)[0], icon: 'http://x.test/i.png' }] }), 'links'],
  ])('refuses a plain http address in a %s on write and in validate', (_case, stored, field) => {
    const definition = defaultBlocks[stored.type as DefaultBlockType];
    expect(definition.content.safeParse(stored.content).success).toBe(false);
    expect(validate([stored], profile)).toContainEqual(expect.objectContaining({ kind: 'href-invalid', field }));
  });
});

describe('a profile naming a library block as its own', () => {
  it('refuses it, since the email already holds it', () => {
    expect(() => emailProfile({ blocks: [card] })).toThrow(/already an email kind/);
  });
});
