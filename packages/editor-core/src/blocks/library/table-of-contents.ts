import type { NodeJSON } from '../../document/core/types/index.js';
import { defineBlock } from '../define-block.js';

/** One heading a table of contents lists. */
export interface ContentsEntry {
  /** 1 to 3. */
  readonly level: number;
  readonly text: string;
  /** Its place among the listed headings, in document order, from 0. */
  readonly index: number;
}

function textOf(node: NodeJSON): string {
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(textOf).join('');
}

/**
 * The headings of level 1 to 3 in `doc`, in document order, wherever they sit: a toggle heading's summary, a
 * callout's or a column's heading included. A heading with no text is left out.
 */
export function contentsOf(doc: NodeJSON): ContentsEntry[] {
  const entries: ContentsEntry[] = [];
  let index = 0;
  const visit = (node: NodeJSON): void => {
    if (node.type === 'heading') {
      // As the heading codec draws it, so the entry's place matches the drawn h1 to h3.
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
      if (level <= 3) {
        const text = textOf(node).trim();
        if (text !== '') entries.push({ level, text, index });
        index += 1;
      }
      return;
    }
    for (const child of node.content ?? []) visit(child);
  };
  visit(doc);
  return entries;
}

/**
 * The document's headings as a list of links to them, drawn from the document where it is shown. Its exports
 * hold the place only, since a block's HTML is written from the block alone.
 */
export const tableOfContents = defineBlock({
  type: 'tableOfContents',
  label: 'Table of contents',
  description: "The document's headings",
  keywords: ['toc', 'contents', 'outline', 'headings'],
  fields: {},
  document: { html: (_view, markup) => markup`<nav data-table-of-contents></nav>` },
});
