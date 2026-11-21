import { button } from './button.js';
import { callout } from './callout.js';
import { code } from './code.js';
import { columns } from './columns.js';
import { divider } from './divider.js';
import { html } from './html.js';
import { list } from './list.js';
import { paragraph } from './paragraph.js';

/** The eight block types every renderer knows, keyed by type. */
export const defaultBlocks = { paragraph, button, code, list, callout, divider, columns, html } as const;

export type DefaultBlocks = typeof defaultBlocks;
export type DefaultBlockType = keyof DefaultBlocks;
