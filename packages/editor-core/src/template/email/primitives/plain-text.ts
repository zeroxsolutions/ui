import type { EmailNode, TextEnd, TextRun } from './nodes.js';

function ending(end: TextEnd): string {
  return end === 'line' ? '\n' : '\n\n';
}

function runsText(runs: readonly TextRun[]): string {
  return runs
    .map((run) => (run.kind === 'text' ? run.text : `${run.label.map((part) => part.text).join('')} (${run.href})`))
    .join('');
}

/**
 * The text arm of `nodes`: what each reads as, a paragraph ending in a blank line. A mail with no plain-text
 * twin is filed as spam by many receivers, so every primitive that shows text has one.
 */
export function plainTextOf(nodes: readonly EmailNode[]): string {
  return nodes.map(plainTextOfNode).join('');
}

function plainTextOfNode(node: EmailNode): string {
  switch (node.kind) {
    case 'section':
    case 'column':
    case 'card':
      return plainTextOf(node.children);
    case 'columns':
      return plainTextOf(node.columns);
    case 'text':
      return runsText(node.runs) + ending(node.textEnd);
    case 'heading':
      return `${runsText(node.runs)}\n\n`;
    case 'button':
      return `${node.label}: ${node.href}\n\n`;
    case 'image':
      return node.href === null ? '' : `${node.alt}: ${node.href}\n\n`;
    case 'divider':
      return '\n';
    case 'list':
      return `${node.items.map((item, index) => `${node.ordered ? `${index + 1}.` : '-'} ${runsText(item)}`).join('\n')}\n\n`;
    case 'code':
      return `${node.text}\n\n`;
    case 'raw':
      return node.text;
    case 'spacer':
    case 'preheader':
      return '';
    case 'region': {
      const text = plainTextOf(node.children).trim();
      return text === '' ? '' : text + ending(node.textEnd);
    }
  }
}
