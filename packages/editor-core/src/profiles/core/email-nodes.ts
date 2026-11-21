import { z } from 'zod';
import type { MarkSpec, NodeSpec } from '../../document/core/types/index.js';

const ALIGNS = ['left', 'center', 'right'] as const;
const SPACES = ['small', 'medium', 'large'] as const;

/** Every attribute is optional with no default, so an attribute a block never carried stays off it. */
const identity = { id: z.string().nullable().optional(), key: z.string().optional() };
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
    attrs: z.object({ ...identity, ...shape }),
    ...spec,
  };
}

/**
 * The email profile's nodes and marks. The paragraph is the core's own, carrying `id`, `key`, `align`,
 * `spaceAfter`, `tone` and `source` as global attributes, so it is not listed here.
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
