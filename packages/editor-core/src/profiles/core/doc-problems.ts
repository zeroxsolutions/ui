import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import type { ProfileProblem } from './types.js';

const FOLDED = new Set(['heading', 'orderedList', 'taskList', 'blockquote']);

function isLone(children: readonly NodeJSON[] | undefined, type: string): boolean {
  return children === undefined || children.length === 0 || (children.length === 1 && children[0].type === type);
}

/** Whether the email export keeps this block's structure, not only its text. */
function isCarried(node: NodeJSON): boolean {
  if (FOLDED.has(node.type)) return false;
  if (node.type === 'callout') return isLone(node.content, 'paragraph');
  if (node.type === 'bulletList') return (node.content ?? []).every((item) => isLone(item.content, 'paragraph'));
  return true;
}

function problemsIn(blocks: readonly NodeJSON[], problems: ProfileProblem[]): void {
  for (const node of blocks) {
    if (node.type === 'emailColumns') {
      for (const lane of node.content ?? []) problemsIn(lane.content ?? [], problems);
      continue;
    }
    if (isCarried(node)) continue;
    const { id, key } = node.attrs ?? {};
    const blockId = typeof id === 'string' ? id : null;
    const blockKey = typeof key === 'string' ? key : '';
    problems.push({
      kind: 'block-not-carried',
      block: blockId ?? blockKey,
      blockId,
      blockKey,
    });
  }
}

/**
 * The blocks of `doc`, top-level and in a lane, that the email export folds into a paragraph or a
 * list and so loses structure from: a heading, an ordered or task list, a blockquote, a list item
 * holding more than one paragraph or a nested list, and a callout holding more than one paragraph.
 * Their text is kept; the problem is for the author to see, never a refusal.
 */
export function docProblems(doc: DocJSON): ProfileProblem[] {
  const problems: ProfileProblem[] = [];
  problemsIn(doc.content ?? [], problems);
  return problems;
}
