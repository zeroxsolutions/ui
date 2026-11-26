import { z } from 'zod';
import type { MarkSpec, NodeSpec } from '../../document/core/types/index.js';
import {
  ALIGNS,
  LAYOUT_NODES,
  SECTION_BACKGROUNDS,
  SECTION_WIDTHS,
  SPACES,
  VALIGNS,
  type Layout,
} from '../../template/layout/index.js';

/**
 * The block node types, besides the paragraph, that carry `id` and `key` under `blockIdentity`: the
 * document's own blocks the email reads, the email's own, and the ones the export may fold into a
 * paragraph or a list (`heading`, `orderedList`, `taskList`, `blockquote`) so a pasted one keeps an identity, and
 * the library's blocks, each a node named for its type.
 */
export const EMAIL_BLOCK_NODES = [
  'bulletList',
  'callout',
  'codeBlock',
  'horizontalRule',
  'button',
  'columns',
  'emailHtml',
  'emailUnknown',
  'heading',
  'orderedList',
  'taskList',
  'blockquote',
  'image',
  'table',
  'spacer',
  'socialLinks',
  'hero',
  'card',
  'legalFooter',
  'section',
] as const;

/** The document nodes the email reads a layout from, each with the layout keys `LAYOUT_NODES` gives it. */
const EMAIL_LAYOUT_NODES = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'taskList',
  'codeBlock',
  'callout',
  'horizontalRule',
  'image',
  'table',
] as const satisfies readonly (keyof typeof LAYOUT_NODES)[];

/**
 * The attributes the email reads from a document node beside its layout keys: a text block's alignment and size,
 * a code block's alignment, a table's column widths, a paragraph's tone, and the stored text or block an import
 * keeps (`source`, `stored`).
 */
const EMAIL_OWN_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  paragraph: ['textAlign', 'size', 'tone', 'source'],
  heading: ['textAlign', 'source', 'stored'],
  blockquote: ['source'],
  callout: ['source'],
  codeBlock: ['align'],
  image: ['stored'],
  table: ['columnWidths', 'stored'],
  spacer: ['stored'],
  socialLinks: ['stored'],
  hero: ['stored'],
  card: ['stored'],
  legalFooter: ['stored'],
};

/**
 * The attributes the email export reads from each document node, by node name, that are not the node's own: the
 * layout keys of `LAYOUT_NODES` and the email's own. A document declares them as global attributes on its nodes;
 * the button, columns, section and html nodes declare theirs themselves.
 */
export const EMAIL_LAYOUT_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  [...new Set([...EMAIL_LAYOUT_NODES, ...Object.keys(EMAIL_OWN_ATTRIBUTES)])].map((type) => [
    type,
    [
      ...((LAYOUT_NODES as Readonly<Record<string, readonly (keyof Layout)[]>>)[type] ?? []).filter(
        (key) => (EMAIL_LAYOUT_NODES as readonly string[]).includes(type) && key !== 'responsive',
      ),
      ...(EMAIL_OWN_ATTRIBUTES[type] ?? []),
    ],
  ]),
);

/** A node's alignment: the layout's names, or the wire's `left` and `right`, which a document written before them holds. */
const align = z.enum([...ALIGNS, 'left', 'right']).optional();
const spaceBefore = z.enum(SPACES).optional();
const spaceAfter = z.enum(SPACES).optional();

function block(name: string, spec: Partial<NodeSpec>, shape: z.ZodRawShape): NodeSpec {
  return {
    name,
    group: 'block',
    draggable: true,
    selectable: true,
    attrs: z.object(shape),
    ...spec,
  };
}

/**
 * The Document Editor's button: a link drawn as a button, an atom whose label and href are attributes. The email
 * profile stores it as its `button` block; the registry's `button` feature gives it a view.
 */
export const buttonNodeSpec: NodeSpec = block(
  'button',
  { atom: true },
  {
    label: z.string().optional(),
    href: z.string().optional(),
    align,
    spaceBefore,
    spaceAfter,
    width: z.enum(['inline', 'full']).optional(),
  },
);

/**
 * The Document Editor's columns and the column each lane is: `ratio` weighs the columns against each other, absent
 * for equal ones, and `valign` places each lane's blocks against the tallest, at the top when absent. A column is in
 * no group, so only a columns block holds one. `columnContent` names what a column holds, any block but a section
 * when absent; the email profile narrows it so a column never holds another columns block.
 */
export function columnsNodeSpecs(columnContent = 'sectionBlock+'): NodeSpec[] {
  return [
    // Any count, so a stored block of too few or too many lanes still opens and shows its problem.
    block(
      'columns',
      { content: 'column+' },
      { ratio: z.array(z.number()).optional(), valign: z.enum(VALIGNS).optional(), spaceBefore, spaceAfter },
    ),
    { name: 'column', content: columnContent, defining: true, container: true },
  ];
}

/**
 * Both editors' section: blocks on a background, inside a padding, at the content's width, the page's or the
 * viewport's. `sectionContent` names what it holds; the default, `sectionBlock+`, is every block node of the editor
 * but the section, which the feature compiler spells out, so a section never holds a section. The email draws no
 * `full` width.
 */
export function sectionNodeSpecs(sectionContent = 'sectionBlock+'): NodeSpec[] {
  return [
    block(
      'section',
      { content: sectionContent, defining: true, container: true },
      {
        background: z.enum(SECTION_BACKGROUNDS).optional(),
        padding: z.enum(SPACES).optional(),
        width: z.enum(SECTION_WIDTHS).optional(),
        spaceBefore,
        spaceAfter,
      },
    ),
  ];
}

/**
 * The email profile's own nodes and its link mark; bold and italic are the document's own marks. The paragraph
 * is the core's own, carrying `align`, `spaceAfter`, `tone` and `source` as global attributes, so it is not
 * listed here; lists, callouts, code, rules, buttons and columns are the document's own nodes, which the codec
 * reads by type name. No node declares `id` or `key`: `blockIdentity` owns them, on the paragraph and on every
 * type in `EMAIL_BLOCK_NODES`, so it can keep them out of HTML, which a node's own attributes cannot. Html carries
 * no mark, since the export stores it as plain text.
 */
export const emailNodeSpecs: { nodes: NodeSpec[]; marks: MarkSpec[] } = {
  nodes: [
    block('emailHtml', { content: 'text*', marks: '' }, { spaceBefore, spaceAfter }),
    block('emailUnknown', { atom: true }, { block: z.unknown().optional() }),
    { name: 'variable', group: 'inline', atom: true, attrs: z.object({ name: z.string() }) },
  ],
  marks: [{ name: 'emailLink', htmlTag: 'a', inclusive: false, attrs: z.object({ href: z.string() }) }],
};
