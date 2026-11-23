import { z } from 'zod';
import type { MarkSpec, NodeSpec } from '../../document/core/types/index.js';

/**
 * The block node types, besides the paragraph, that carry `id` and `key` under `blockIdentity`: the
 * document's own blocks the email reads, the email's own, and the ones the export folds into a
 * paragraph or a list (`heading`, `orderedList`, `taskList`, `blockquote`) so a pasted one keeps an identity.
 */
export const EMAIL_BLOCK_NODES = [
  'bulletList',
  'callout',
  'codeBlock',
  'horizontalRule',
  'emailButton',
  'emailColumns',
  'emailHtml',
  'emailUnknown',
  'heading',
  'orderedList',
  'taskList',
  'blockquote',
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
 * The email profile's nodes and its link mark; bold and italic are the document's own marks. The paragraph is the core's own, carrying `align`, `spaceAfter`,
 * `tone` and `source` as global attributes, so it is not listed here; lists, callouts, code and rules
 * are the document's own nodes, which the codec reads by type name. No node declares `id` or `key`:
 * `blockIdentity` owns them, on the paragraph and on every type in `EMAIL_BLOCK_NODES`, so it can keep
 * them out of HTML, which a node's own attributes cannot. A lane is in no group, so only a columns
 * block holds one; html carries no mark, since the export stores it as plain text.
 */
export const emailNodeSpecs: { nodes: NodeSpec[]; marks: MarkSpec[] } = {
  nodes: [
    block(
      'emailButton',
      { atom: true },
      {
        label: z.string().optional(),
        href: z.string().optional(),
        align,
        spaceAfter,
        width: z.enum(['inline', 'full']).optional(),
      },
    ),
    block('emailColumns', { content: 'emailLane+' }, { ratio: z.array(z.number()).optional(), spaceAfter }),
    { name: 'emailLane', content: 'block*', defining: true, container: true },
    block('emailHtml', { content: 'text*', marks: '' }, { spaceAfter }),
    block('emailUnknown', { atom: true }, { block: z.unknown().optional() }),
    { name: 'variable', group: 'inline', atom: true, attrs: z.object({ name: z.string() }) },
  ],
  marks: [{ name: 'emailLink', htmlTag: 'a', inclusive: false, attrs: z.object({ href: z.string() }) }],
};
