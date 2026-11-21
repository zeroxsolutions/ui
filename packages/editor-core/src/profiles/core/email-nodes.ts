import { z } from 'zod';
import type { MarkSpec, NodeSpec } from '../../document/core/types/index.js';

/** The email node types that are blocks: each carries `id` and `key` under `blockIdentity`. */
export const EMAIL_BLOCK_NODES = [
  'emailButton',
  'emailCode',
  'emailList',
  'emailCallout',
  'emailDivider',
  'emailColumns',
  'emailHtml',
  'emailUnknown',
] as const;

const ALIGNS = ['left', 'center', 'right'] as const;
const SPACES = ['small', 'medium', 'large'] as const;

/** The text as stored, kept so an unedited field exports as it was read. */
const source = z.string().optional();
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
 * The email profile's nodes and marks. The paragraph is the core's own, carrying `align`, `spaceAfter`,
 * `tone` and `source` as global attributes, so it is not listed here. No node declares `id` or `key`:
 * `blockIdentity` owns them, on the paragraph and on every type in `EMAIL_BLOCK_NODES`, so it can keep
 * them out of HTML, which a node's own attributes cannot.
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
    block('emailCode', { content: 'text*' }, { align, spaceAfter }),
    block('emailList', { content: 'emailListItem+' }, { align, spaceAfter }),
    { name: 'emailListItem', group: 'block', content: 'inline*', defining: true, attrs: z.object({ source }) },
    block('emailCallout', { content: 'inline*' }, { align, spaceAfter, source }),
    block('emailDivider', { atom: true }, { spaceAfter }),
    block('emailColumns', { content: 'emailLane+' }, { ratio: z.array(z.number()).optional() }),
    { name: 'emailLane', group: 'block', content: 'block*', defining: true },
    block('emailHtml', { content: 'text*' }, { spaceAfter }),
    block('emailUnknown', { atom: true }, { block: z.unknown().optional() }),
    { name: 'variable', group: 'inline', atom: true, attrs: z.object({ name: z.string() }) },
  ],
  marks: [
    { name: 'bold', htmlTag: 'strong' },
    { name: 'italic', htmlTag: 'em' },
    { name: 'emailLink', htmlTag: 'a', inclusive: false, attrs: z.object({ variable: z.string() }) },
  ],
};
