import type { MarkJSON, NodeJSON } from '../document/core/types/index.js';
import {
  parseInlineMarkup,
  printInlineMarkup,
  type InlineRun,
  type InlineText,
} from '../template/markup/inline-markup.js';

/** The document's link mark's address, or undefined for a node it does not mark. */
function hrefOf(node: NodeJSON): string | undefined {
  const href = node.marks?.find((mark) => mark.type === 'link')?.attrs?.href;
  return typeof href === 'string' ? href : undefined;
}

/**
 * A block body's inline nodes as inline markup: bold, italic and links survive, a hard break is a newline, and
 * every other mark and inline node is dropped, since the markup has no way to spell it.
 */
export function markupOfNodes(nodes: readonly NodeJSON[]): string {
  const runs: InlineRun[] = [];
  for (const node of nodes) {
    const text = node.type === 'hardBreak' ? '\n' : node.type === 'text' ? (node.text ?? '') : '';
    if (text === '') continue;
    const marks = node.marks ?? [];
    const part: InlineText = {
      kind: 'text',
      text,
      bold: marks.some((mark) => mark.type === 'bold'),
      italic: marks.some((mark) => mark.type === 'italic'),
    };
    const href = hrefOf(node);
    const last = runs.at(-1);
    if (href === undefined) runs.push(part);
    else if (last?.kind === 'link' && last.href === href)
      runs[runs.length - 1] = { ...last, label: [...last.label, part] };
    else runs.push({ kind: 'link', href, label: [part] });
  }
  return printInlineMarkup(runs);
}

/** A link a reader opens: a web or mail address. Any other keeps its text and loses the link. */
const ADDRESS = /^(?:https?:|mailto:)/i;

function nodesOfText(part: InlineText, href?: string): NodeJSON[] {
  const marks: MarkJSON[] = [
    ...(part.bold ? [{ type: 'bold' }] : []),
    ...(part.italic ? [{ type: 'italic' }] : []),
    ...(href === undefined || !ADDRESS.test(href.trim()) ? [] : [{ type: 'link', attrs: { href } }]),
  ];
  return part.text
    .split('\n')
    .flatMap((line, index): NodeJSON[] => [
      ...(index > 0 ? [{ type: 'hardBreak' }] : []),
      ...(line === '' ? [] : [{ type: 'text', text: line, ...(marks.length === 0 ? {} : { marks }) }]),
    ]);
}

/** The inline nodes `markup` reads as; markup that does not parse is kept as its plain text. */
export function nodesOfMarkup(markup: string): NodeJSON[] {
  const parsed = parseInlineMarkup(markup);
  if (!parsed.ok) return nodesOfText({ kind: 'text', text: markup, bold: false, italic: false });
  return parsed.runs.flatMap((run) =>
    run.kind === 'text' ? nodesOfText(run) : run.label.flatMap((part) => nodesOfText(part, run.href)),
  );
}
