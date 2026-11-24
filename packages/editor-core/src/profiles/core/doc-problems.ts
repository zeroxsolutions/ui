import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import type { EmailExportOptions } from './email-blocks.js';
import type { ProfileProblem } from './types.js';

/** The lists the export always folds into a bulleted one. */
const FOLDED = new Set(['orderedList', 'taskList']);
/** The document blocks the export carries as the kind each is, where the profile holds that kind. */
const CARRIED_AS: Readonly<Record<string, string>> = { heading: 'heading', blockquote: 'quote' };
/** The document blocks the export writes as the kind each is, which a profile without it cannot hold. */
const WRITTEN_AS: Readonly<Record<string, string>> = { image: 'image', table: 'table' };

function isLone(children: readonly NodeJSON[] | undefined, type: string): boolean {
  return children === undefined || children.length === 0 || (children.length === 1 && children[0].type === type);
}

/** Whether the email export keeps this block's structure, not only its text. */
function isCarried(node: NodeJSON, kinds: ReadonlySet<string> | null): boolean {
  if (FOLDED.has(node.type)) return false;
  if (Object.hasOwn(CARRIED_AS, node.type) && (kinds === null || !kinds.has(CARRIED_AS[node.type]))) return false;
  if (node.type === 'blockquote') return isLone(node.content, 'paragraph');
  if (Object.hasOwn(WRITTEN_AS, node.type)) return kinds === null || kinds.has(WRITTEN_AS[node.type]);
  if (node.type === 'callout') return isLone(node.content, 'paragraph');
  if (node.type === 'bulletList') return (node.content ?? []).every((item) => isLone(item.content, 'paragraph'));
  return true;
}

function problemsIn(blocks: readonly NodeJSON[], kinds: ReadonlySet<string> | null, problems: ProfileProblem[]): void {
  for (const node of blocks) {
    if (node.type === 'columns') {
      for (const lane of node.content ?? []) problemsIn(lane.content ?? [], kinds, problems);
      continue;
    }
    if (isCarried(node, kinds)) continue;
    const { id, key } = node.attrs ?? {};
    const block = typeof id === 'string' ? id : typeof key === 'string' ? key : null;
    problems.push({ kind: 'block-not-carried', block });
  }
}

/**
 * The blocks of `doc`, top-level and in a lane, that the email export folds into a paragraph or a list and so
 * loses structure from, or that the profile cannot hold: a heading or a blockquote where `kinds` lack `heading`
 * or `quote` (always, without `kinds`), an image or a table where they lack `image` or `table`, an ordered or
 * task list, a list item holding more than one paragraph or a nested list, and a callout holding more than one
 * paragraph. Their text is kept; the problem is for the author to see, never a refusal.
 */
export function docProblems(doc: DocJSON, options: EmailExportOptions = {}): ProfileProblem[] {
  const problems: ProfileProblem[] = [];
  problemsIn(doc.content ?? [], options.kinds === undefined ? null : new Set(options.kinds), problems);
  return problems;
}
