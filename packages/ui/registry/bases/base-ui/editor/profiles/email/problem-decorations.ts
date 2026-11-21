import { Decoration } from '@tiptap/pm/view';
import type { ProseMirrorNode } from '@zeroxsolutions/editor-core/document/advanced';
import type { ProblemKind, ProfileProblem } from '@zeroxsolutions/editor-core/profiles/index';
import { problemMessage } from '../problem-messages';
import { carriesKey } from './kit-context';

/** The problems marked on one place: a block, or a variable token or link inside it. */
export interface ProblemMark {
  /** The element id of the messages, which the marked element is described by. */
  id: string;
  /** The block's id, or its key when it has none. */
  block: string;
  /** The variable the problems name, marked on its token where the block holds one. */
  name?: string;
  kinds: ProblemKind[];
  messages: string[];
}

/**
 * The marks `problems` make, one per block and named variable, and the messages of the problems no block holds,
 * such as too many blocks. `idBase` keeps the element ids of two editors apart.
 */
export function problemMarks(
  problems: readonly ProfileProblem[],
  idBase: string,
): { marks: ProblemMark[]; unplaced: string[] } {
  const marks = new Map<string, ProblemMark>();
  const unplaced: string[] = [];
  for (const problem of problems) {
    if (problem.block === null) {
      unplaced.push(problemMessage(problem));
      continue;
    }
    const where = `${problem.block}\u0000${problem.name ?? ''}`;
    let mark = marks.get(where);
    if (!mark) {
      mark = { id: `${idBase}-problem-${marks.size}`, block: problem.block, kinds: [], messages: [] };
      if (problem.name !== undefined) mark.name = problem.name;
      marks.set(where, mark);
    }
    const message = problemMessage(problem);
    if (!mark.kinds.includes(problem.kind)) mark.kinds.push(problem.kind);
    if (!mark.messages.includes(message)) mark.messages.push(message);
  }
  return { marks: [...marks.values()], unplaced };
}

/** The id a problem names a block by: its own, or its key when the host has not given it one. */
export function blockRef(node: ProseMirrorNode): string | undefined {
  const id = node.attrs.id ?? node.attrs.key;
  return typeof id === 'string' && id !== '' ? id : undefined;
}

const MARKED = 'bg-destructive/10 underline decoration-destructive decoration-wavy';

/**
 * The decorations `marks` put on `doc`: each on the variable token or the linked text it names in its block, or
 * on the block itself. Each marked element is described by its messages, so a screen reader in the text reads
 * them; the marker beside the block shows them on hover and on focus.
 */
export function problemDecorations(doc: ProseMirrorNode, marks: readonly ProblemMark[]): Decoration[] {
  if (marks.length === 0) return [];
  const byBlock = new Map<string, ProblemMark[]>();
  for (const mark of marks) byBlock.set(mark.block, [...(byBlock.get(mark.block) ?? []), mark]);
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!carriesKey(node)) return true;
    const ref = blockRef(node);
    for (const mark of (ref && byBlock.get(ref)) || []) {
      const attrs = { class: MARKED, 'data-problem': mark.kinds.join(' '), 'aria-describedby': mark.id };
      const inside = mark.name === undefined ? [] : tokensOf(node, pos, mark.name);
      if (inside.length === 0) decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs));
      for (const { from, to, atom } of inside) {
        decorations.push(atom ? Decoration.node(from, to, attrs) : Decoration.inline(from, to, attrs));
      }
    }
    // A lane's blocks are marked on their own.
    return true;
  });
  return decorations;
}

/** The variable chips named `name` in `block`, and the text it links to `name`. */
function tokensOf(block: ProseMirrorNode, pos: number, name: string): { from: number; to: number; atom: boolean }[] {
  const found: { from: number; to: number; atom: boolean }[] = [];
  block.descendants((node, offset) => {
    if (carriesKey(node)) return false;
    const from = pos + 1 + offset;
    if (node.type.name === 'variable' && node.attrs.name === name) {
      found.push({ from, to: from + node.nodeSize, atom: true });
    } else if (
      node.isText &&
      node.marks.some((mark) => mark.type.name === 'emailLink' && mark.attrs.variable === name)
    ) {
      found.push({ from, to: from + node.nodeSize, atom: false });
    }
    return true;
  });
  return found;
}
