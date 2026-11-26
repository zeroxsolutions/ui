// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import { defaultBlocks } from '../../template/email/blocks/index.js';
import { docProblems } from './doc-problems.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import { EMAIL_KINDS, emailProfile, MAIL_LAYOUT_KINDS } from './profile.js';
import type { EditorEmailBlock } from './types.js';
import { validate } from './validate.js';

const ALL = { kinds: EMAIL_KINDS };
const text = (value: string): NodeJSON => ({ type: 'text', text: value });
const para = (value: string): NodeJSON => ({ type: 'paragraph', content: value === '' ? [] : [text(value)] });
const docOf = (...content: NodeJSON[]): DocJSON => ({ type: 'doc', content });
const cell = (type: 'tableCell' | 'tableHeader', value: string, colspan?: number): NodeJSON => ({
  type,
  ...(colspan === undefined ? {} : { attrs: { colspan } }),
  content: [para(value)],
});
const row = (...cells: NodeJSON[]): NodeJSON => ({ type: 'tableRow', content: cells });
const block = (overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock => ({
  id: null,
  key: 'k',
  attributes: {},
  content: {},
  ...overrides,
});

describe('the email kinds', () => {
  it('hold heading, quote, image and table, and leave them out of a mail layout', () => {
    expect(EMAIL_KINDS).toEqual(expect.arrayContaining(['heading', 'quote', 'image', 'table']));
    expect(MAIL_LAYOUT_KINDS).toEqual(['paragraph', 'list', 'callout', 'divider', 'columns', 'legalFooter']);
  });
});

describe('a heading through the email codec', () => {
  const heading = (level: number): NodeJSON => ({
    type: 'heading',
    attrs: { level, align: 'center' },
    content: [text('Hi')],
  });

  it('exports as a heading where the profile holds one, a level past 3 as 3', () => {
    expect(toEmailBlocks(docOf(heading(1)), [], ALL)[0]).toMatchObject({
      type: 'heading',
      attributes: { level: 1, align: 'center' },
      content: { text: 'Hi' },
    });
    expect(toEmailBlocks(docOf(heading(5)), [], ALL)[0].attributes).toEqual({ level: 3, align: 'center' });
  });

  it('folds into a paragraph where the profile holds none, as before', () => {
    expect(toEmailBlocks(docOf(heading(1)), [], { kinds: MAIL_LAYOUT_KINDS })[0]).toMatchObject({
      type: 'paragraph',
      attributes: {},
      content: { text: 'Hi' },
    });
  });

  it('stays a heading where the export names no kinds, as a stored one is', () => {
    expect(toEmailBlocks(docOf(heading(1)))[0].type).toBe('heading');
  });

  it('round-trips a stored heading', () => {
    const stored = [
      block({
        id: 'h',
        type: 'heading',
        attributes: { level: 3, spaceAfter: 'large' },
        content: { text: '**Day** {{n}}' },
      }),
    ];
    expect(fromEmailBlocks(stored).content?.[0]).toMatchObject({ type: 'heading', attrs: { level: 3 } });
    expect(toEmailBlocks(fromEmailBlocks(stored), [], ALL)).toEqual(stored);
  });
});

describe('a quote through the email codec', () => {
  it('exports a blockquote as a quote joining its paragraphs, and round-trips', () => {
    const quote: NodeJSON = { type: 'blockquote', attrs: { align: 'right' }, content: [para('a'), para('b')] };
    expect(toEmailBlocks(docOf(quote), [], ALL)[0]).toMatchObject({
      type: 'quote',
      attributes: { align: 'right' },
      content: { text: 'a b' },
    });
    const stored = [block({ id: 'q', type: 'quote', content: { text: '_Lovely_ {{name}}' } })];
    expect(toEmailBlocks(fromEmailBlocks(stored), [], ALL)).toEqual(stored);
  });

  it('folds into a paragraph where the profile holds none', () => {
    const quote: NodeJSON = { type: 'blockquote', content: [para('a')] };
    expect(toEmailBlocks(docOf(quote), [], { kinds: ['paragraph'] })[0].type).toBe('paragraph');
  });
});

describe('an image through the email codec', () => {
  it("exports the document image with its caption, link and a pixel width as a fraction of the Document's, and round-trips", () => {
    const image: NodeJSON = {
      type: 'image',
      attrs: {
        src: 'https://x.test/a.png',
        alt: 'A bay',
        title: '',
        width: 360,
        caption: 'Morning',
        href: '{{u}}',
        align: 'center',
      },
    };
    expect(toEmailBlocks(docOf(image), [], ALL)[0]).toEqual({
      id: null,
      key: '',
      type: 'image',
      attributes: { align: 'center', width: 0.5 },
      content: { src: 'https://x.test/a.png', alt: 'A bay', caption: 'Morning', href: '{{u}}' },
    });
    const stored = [
      block({ id: 'i', type: 'image', attributes: { width: 0.35 }, content: { src: '{{banner}}', alt: 'Banner' } }),
    ];
    expect(toEmailBlocks(fromEmailBlocks(stored), [], ALL)).toEqual(stored);
  });

  it("exports a pixel width past the Document's content as the whole width, which is no width", () => {
    const image: NodeJSON = { type: 'image', attrs: { src: 'https://x.test/a.png', alt: 'a', width: 900 } };
    expect(toEmailBlocks(docOf(image), [], ALL)[0].attributes).toEqual({});
  });
});

describe('a table through the email codec', () => {
  const table: NodeJSON = {
    type: 'table',
    content: [
      row(cell('tableHeader', 'Day'), cell('tableHeader', 'Place')),
      row(cell('tableCell', 'Both', 2)),
      row(
        { type: 'tableCell', content: [{ type: 'paragraph', content: [{ ...text('1'), marks: [{ type: 'bold' }] }] }] },
        cell('tableCell', ''),
        cell('tableCell', 'extra'),
      ),
    ],
  };

  it('exports its rows, a header row, a merged cell padded and every row padded to the widest', () => {
    expect(toEmailBlocks(docOf(table), [], ALL)[0]).toEqual({
      id: null,
      key: '',
      type: 'table',
      attributes: { header: true },
      content: {
        rows: [
          ['Day', 'Place', ''],
          ['Both', '', ''],
          ['**1**', '', 'extra'],
        ],
      },
    });
  });

  it('round-trips a stored table', () => {
    const stored = [
      block({
        id: 't',
        type: 'table',
        attributes: { header: true },
        content: {
          rows: [
            ['a', 'b'],
            ['{{x}}', ''],
          ],
        },
      }),
    ];
    const doc = fromEmailBlocks(stored);
    expect(doc.content?.[0].content?.[0].content?.map((one) => one.type)).toEqual(['tableHeader', 'tableHeader']);
    expect(toEmailBlocks(doc, [], ALL)).toEqual(stored);
  });

  it('reads a stored table of no rows, or rows that are not lists, without throwing', () => {
    const doc = fromEmailBlocks([
      block({ type: 'table', content: { rows: 'x' } }),
      block({ type: 'table', content: { rows: [5, ['a']] } }),
    ]);
    expect(doc.content?.map((node) => node.type)).toEqual(['table', 'table']);
  });
});

describe('docProblems for the content kinds', () => {
  const heading: NodeJSON = { type: 'heading', attrs: { level: 1, key: 'h' }, content: [text('Hi')] };
  const image: NodeJSON = { type: 'image', attrs: { src: 'https://x.test/a.png', alt: 'a', key: 'i' } };
  const table: NodeJSON = { type: 'table', attrs: { key: 't' }, content: [row(cell('tableCell', 'a'))] };

  it('flags a heading, an image or a table only where the profile does not carry it', () => {
    expect(docProblems(docOf(heading, image, table), ALL)).toEqual([]);
    expect(docProblems(docOf(heading, image, table), { kinds: MAIL_LAYOUT_KINDS })).toEqual([
      { kind: 'block-not-carried', block: 'h' },
      { kind: 'block-not-carried', block: 'i' },
      { kind: 'block-not-carried', block: 't' },
    ]);
  });
});

describe('validate the content kinds', () => {
  const profile = emailProfile({
    variables: [
      { name: 'u', type: 'url' },
      { name: 'n', type: 'string' },
    ],
  });

  it('checks a heading and a quote as a paragraph is checked', () => {
    expect(validate([block({ type: 'heading', content: { text: '' } })], profile)).toEqual([
      { kind: 'text-empty', block: 'k', field: 'text' },
    ]);
    expect(validate([block({ type: 'quote', content: { text: '**a' } })], profile)).toEqual([
      { kind: 'markup-malformed', block: 'k', field: 'text', offset: 0 },
    ]);
    expect(validate([block({ type: 'heading', attributes: { level: 4 }, content: { text: 'a' } })], profile)).toEqual([
      { kind: 'attributes-invalid', block: 'k', field: 'level' },
    ]);
  });

  it.each<[string, Record<string, unknown>, { kind: string; field?: string }[]]>([
    ['an empty alt', { src: 'https://x.test/a.png', alt: ' ' }, [{ kind: 'text-empty', field: 'alt' }]],
    ['no source', { alt: 'a' }, [{ kind: 'text-empty', field: 'src' }]],
    [
      'a page source that is not https',
      { src: 'http://x.test/a.png', alt: 'a' },
      [{ kind: 'href-invalid', field: 'src' }],
    ],
    ['a script source', { src: 'javascript:x', alt: 'a' }, [{ kind: 'href-invalid', field: 'src' }]],
    ['a source variable of another type', { src: '{{n}}', alt: 'a' }, [{ kind: 'href-invalid', field: 'src' }]],
    [
      'a link that runs script',
      { src: '{{u}}', alt: 'a', href: 'javascript:x' },
      [{ kind: 'href-invalid', field: 'href' }],
    ],
    [
      'a caption past its bound',
      { src: '{{u}}', alt: 'a', caption: 'x'.repeat(501) },
      [{ kind: 'text-too-long', field: 'caption' }],
    ],
    ['a source, an alt, a caption and a mail link', { src: '{{u}}', alt: 'a', caption: 'c', href: 'mailto:a@b.c' }, []],
  ])('reports an image with %s', (_case, content, problems) => {
    expect(validate([block({ type: 'image', content })], profile)).toEqual(
      problems.map((problem) => ({ block: 'k', ...problem })),
    );
  });

  it.each<[string, unknown, { kind: string; item?: number; offset?: number }[]]>([
    ['rows that are not a list', 'x', [{ kind: 'content-invalid' }]],
    ['no rows', [], [{ kind: 'text-empty' }]],
    ['21 rows', Array.from({ length: 21 }, () => ['a']), [{ kind: 'table-too-large' }]],
    ['7 columns', [['a', 'b', 'c', 'd', 'e', 'f', 'g']], [{ kind: 'table-too-large' }]],
    ['rows of two widths', [['a', 'b'], ['c']], [{ kind: 'content-invalid' }]],
    ['a row that is not a list', [['a'], 'b'], [{ kind: 'content-invalid', item: 1 }]],
    ['a malformed cell', [['a', '**b']], [{ kind: 'markup-malformed', item: 0, offset: 0 }]],
    [
      'empty cells',
      [
        ['a', ''],
        ['', 'b'],
      ],
      [],
    ],
  ])('reports a table with %s', (_case, rows, problems) => {
    expect(validate([block({ type: 'table', content: { rows } })], profile)).toEqual(
      problems.map((problem) => ({ block: 'k', field: 'rows', ...problem })),
    );
  });

  it('flags an undeclared token in a cell under its row', () => {
    expect(validate([block({ type: 'table', content: { rows: [['{{x}}']] } })], profile)).toEqual([
      { kind: 'variable-undeclared', block: 'k', field: 'rows', item: 0, name: 'x' },
    ]);
  });

  it.each<[string, string, Record<string, unknown>]>([
    ['heading', 'heading', { text: 'Hi {{n}}' }],
    ['quote', 'quote', { text: '_a_' }],
    ['image', 'image', { src: 'https://x.test/a.png', alt: 'a', href: '{{u}}/x' }],
    [
      'table',
      'table',
      {
        rows: [
          ['a', ''],
          ['**b**', 'c'],
        ],
      },
    ],
  ])('passes no %s the write check refuses', (_case, type, content) => {
    expect(validate([block({ type, content })], profile)).toEqual([]);
    expect(defaultBlocks[type as keyof typeof defaultBlocks].content.safeParse(content).success).toBe(true);
  });
});

describe('a stored block of the content kinds, opened and saved unedited', () => {
  it.each([
    ['a heading naming no level', block({ type: 'heading', content: { text: 'Hi' } })],
    ['a heading at level 2', block({ type: 'heading', attributes: { level: 2 }, content: { text: 'Hi' } })],
    [
      'an image with an empty caption and link',
      block({ type: 'image', content: { src: 'https://x.test/a.png', alt: 'a', caption: '', href: '' } }),
    ],
    ['a table with no header row', block({ type: 'table', attributes: { header: false }, content: { rows: [['a']] } })],
    ['a quote whose markup reads back escaped', block({ type: 'quote', content: { text: 'Q *i*' } })],
  ])('saves %s as it was stored, with and without kinds', (_case, stored) => {
    const doc = fromEmailBlocks([stored]);
    expect(toEmailBlocks(doc, [], ALL)).toEqual([stored]);
    expect(toEmailBlocks(doc)).toEqual([stored]);
  });

  it('keeps a quote folded into a paragraph as its stored markup', () => {
    const doc = fromEmailBlocks([block({ type: 'quote', content: { text: 'Q *i*' } })]);
    expect(toEmailBlocks(doc, [], { kinds: ['paragraph'] })[0].content).toEqual({ text: 'Q *i*' });
  });
});

describe('a table cell spanning rows', () => {
  it('keeps the next row in its own columns, the spanned cell padded', () => {
    const spanning: NodeJSON = { type: 'tableCell', attrs: { rowspan: 2 }, content: [para('A')] };
    const table: NodeJSON = {
      type: 'table',
      content: [row(spanning, cell('tableCell', 'B')), row(cell('tableCell', 'C'))],
    };
    expect(toEmailBlocks(docOf(table), [], ALL)[0].content).toEqual({
      rows: [
        ['A', 'B'],
        ['', 'C'],
      ],
    });
  });
});

describe('a ragged table cell spanning rows', () => {
  it('keeps a later row in its columns where a short row ends before the spanned column', () => {
    const spanning: NodeJSON = { type: 'tableCell', attrs: { rowspan: 2 }, content: [para('C')] };
    const table: NodeJSON = {
      type: 'table',
      content: [
        row(cell('tableCell', 'A'), cell('tableCell', 'B'), spanning),
        row(cell('tableCell', 'D')),
        row(cell('tableCell', 'E'), cell('tableCell', 'F'), cell('tableCell', 'G')),
      ],
    };
    expect(toEmailBlocks(docOf(table), [], ALL)[0].content).toEqual({
      rows: [
        ['A', 'B', 'C'],
        ['D', '', ''],
        ['E', 'F', 'G'],
      ],
    });
  });
});

describe('an exported block saved as stored', () => {
  it("is a copy, so a host changing the export leaves the editor's document alone", () => {
    const stored: EditorEmailBlock = block({ type: 'heading', content: { text: 'Hi' } });
    const [exported] = toEmailBlocks(fromEmailBlocks([stored]));
    expect(exported).toEqual(stored);
    expect(exported.content).not.toBe(stored.content);
  });
});

describe('docProblems for a table cell', () => {
  it('flags a table whose cell holds a block the export cannot write in a cell', () => {
    const holding = (...content: NodeJSON[]): NodeJSON => ({
      type: 'table',
      attrs: { key: 't' },
      content: [row({ type: 'tableCell', content })],
    });
    const image: NodeJSON = { type: 'image', attrs: { src: 'https://x.test/a.png', alt: 'a' } };
    expect(docProblems(docOf(holding(para('a'), image)), ALL)).toEqual([{ kind: 'block-not-carried', block: 't' }]);
    expect(docProblems(docOf(holding(para('a'), para('b'))), ALL)).toEqual([{ kind: 'block-not-carried', block: 't' }]);
    expect(docProblems(docOf(holding(para('a'))), ALL)).toEqual([]);
  });
});

describe('validate an image', () => {
  it('takes an empty caption and link as the write check does', () => {
    const stored = block({ type: 'image', content: { src: 'https://x.test/a.png', alt: 'a', caption: '', href: '' } });
    expect(validate([stored], emailProfile())).toEqual([]);
    expect(defaultBlocks.image.content.safeParse(stored.content).success).toBe(true);
  });
});
