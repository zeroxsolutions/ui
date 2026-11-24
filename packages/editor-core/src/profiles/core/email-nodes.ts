import { z } from 'zod';
import type { MarkSpec, NodeSpec } from '../../document/core/types/index.js';

/**
 * The block node types, besides the paragraph, that carry `id` and `key` under `blockIdentity`: the
 * document's own blocks the email reads, the email's own, and the ones the export may fold into a
 * paragraph or a list (`heading`, `orderedList`, `taskList`, `blockquote`) so a pasted one keeps an identity.
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
] as const;

/**
 * The email attributes each document node carries, by node name, for the document to declare as
 * global attributes on its own nodes. The export reads only these from a document node.
 */
export const EMAIL_GLOBAL_ATTRIBUTES: Record<string, string[]> = {
  paragraph: ['align', 'spaceAfter', 'tone', 'source'],
  bulletList: ['align', 'spaceAfter'],
  callout: ['align', 'spaceAfter', 'source'],
  codeBlock: ['align', 'spaceAfter'],
  horizontalRule: ['spaceAfter'],
  heading: ['align', 'spaceAfter', 'source', 'stored'],
  blockquote: ['align', 'spaceAfter', 'source'],
  image: ['align', 'spaceAfter', 'stored'],
  table: ['spaceAfter', 'stored'],
};

const ALIGNS = ['left', 'center', 'right'] as const;
const SPACES = ['small', 'medium', 'large'] as const;

const align = z.enum(ALIGNS).optional();
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
    spaceAfter,
    width: z.enum(['inline', 'full']).optional(),
  },
);

/**
 * The Document Editor's columns and the column each lane is: `ratio` weighs the columns against each other, absent
 * for equal ones. A column is in no group, so only a columns block holds one. `columnContent` names what a column
 * holds, any block when absent; the email profile narrows it so a column never holds another columns block.
 */
export function columnsNodeSpecs(columnContent = 'block+'): NodeSpec[] {
  return [
    // Any count, so a stored block of too few or too many lanes still opens and shows its problem.
    block('columns', { content: 'column+' }, { ratio: z.array(z.number()).optional(), spaceAfter }),
    { name: 'column', content: columnContent, defining: true, container: true },
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
    block('emailHtml', { content: 'text*', marks: '' }, { spaceAfter }),
    block('emailUnknown', { atom: true }, { block: z.unknown().optional() }),
    { name: 'variable', group: 'inline', atom: true, attrs: z.object({ name: z.string() }) },
  ],
  marks: [{ name: 'emailLink', htmlTag: 'a', inclusive: false, attrs: z.object({ href: z.string() }) }],
};
