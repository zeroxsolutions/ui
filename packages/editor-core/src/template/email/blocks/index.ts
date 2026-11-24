import type { FieldPairs } from '../define-email-block.js';
import { button } from './button.js';
import { callout } from './callout.js';
import { card } from './card.js';
import { code } from './code.js';
import { columns } from './columns.js';
import { divider } from './divider.js';
import { heading } from './heading.js';
import { BUTTON_PAIR, hero } from './hero.js';
import { html } from './html.js';
import { image } from './image.js';
import { legalFooter } from './legal-footer.js';
import { list } from './list.js';
import { paragraph } from './paragraph.js';
import { quote } from './quote.js';
import { socialLinks } from './social-links.js';
import { spacer } from './spacer.js';
import { table } from './table.js';

/** The block types every renderer knows, keyed by type. */
export const defaultBlocks = {
  paragraph,
  button,
  code,
  list,
  callout,
  divider,
  columns,
  html,
  heading,
  quote,
  image,
  table,
  spacer,
  socialLinks,
  hero,
  card,
  legalFooter,
} as const;

/**
 * The library's blocks, built as a product's are: each describes itself to an editor through its `editor`, and a
 * document holds it as a node named for its type.
 */
export const libraryBlocks = { spacer, socialLinks, hero, card, legalFooter } as const;

export type LibraryBlockType = keyof typeof libraryBlocks;

/** The fields of a library block filled together or both left empty, which the write check refuses one of. */
export const LIBRARY_BLOCK_PAIRS: Readonly<Partial<Record<LibraryBlockType, FieldPairs>>> = {
  hero: BUTTON_PAIR,
  card: BUTTON_PAIR,
};

export type DefaultBlocks = typeof defaultBlocks;
export type DefaultBlockType = keyof DefaultBlocks;
