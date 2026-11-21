import { Decoration } from '@tiptap/pm/view';
import type { ProseMirrorNode } from '@zeroxsolutions/editor-core/document/advanced';
import {
  measureSmsBody,
  type EditorProfile,
  type ProblemKind,
  type ProfileProblem,
} from '@zeroxsolutions/editor-core/profiles/index';
import { problemMessage } from '../problem-messages';

/** The problems marked on one place of the body: a range of it, or the chips of one variable. */
export interface SmsMark {
  /** The element id of the messages, which the marked element is described by. */
  id: string;
  kinds: ProblemKind[];
  messages: string[];
  /** The marked characters of the body, as `toSmsText` writes it. */
  range?: { from: number; to: number };
  /** The variable the problems name, marked on each of its chips. */
  name?: string;
}

/** The first offset of `body` after which it takes more segments than `maxSegments`. */
function overflowOffset(body: string, maxSegments: number): number {
  const over = (length: number) => {
    const { units, limit, segments } = measureSmsBody(body.slice(0, length));
    return units > limit && segments > maxSegments;
  };
  let low = 0;
  let high = body.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (over(middle)) high = middle;
    else low = middle + 1;
  }
  // The character that took the body over, not the length that did.
  return Math.max(0, low - 1);
}

/**
 * The marks `problems` make on `body`, and the messages of the problems no place holds, such as a required
 * variable the body never prints. `idBase` keeps the element ids of two editors apart.
 */
export function smsMarks(
  problems: readonly ProfileProblem[],
  body: string,
  profile: EditorProfile,
  idBase: string,
): { marks: SmsMark[]; unplaced: string[] } {
  const marks = new Map<string, SmsMark>();
  const unplaced: string[] = [];
  for (const problem of problems) {
    let where: string;
    let place: Pick<SmsMark, 'range' | 'name'>;
    if (problem.kind === 'sms-segment-exceeded') {
      // The characters that took the body past the limit.
      let from = overflowOffset(body, profile.maxSegments ?? 1);
      // An emoji is two code units; the mark takes it whole.
      const unit = body.charCodeAt(from);
      if (from > 0 && unit >= 0xdc00 && unit <= 0xdfff) from -= 1;
      where = `tail ${from}`;
      place = { range: { from, to: body.length } };
    } else if (problem.offset !== undefined) {
      where = `at ${problem.offset}`;
      place = { range: { from: problem.offset, to: problem.offset + 2 } };
    } else if (problem.name !== undefined && problem.kind === 'variable-undeclared') {
      where = `name ${problem.name}`;
      place = { name: problem.name };
    } else {
      unplaced.push(problemMessage(problem));
      continue;
    }
    let mark = marks.get(where);
    if (!mark) {
      mark = { id: `${idBase}-problem-${marks.size}`, kinds: [], messages: [], ...place };
      marks.set(where, mark);
    }
    const message = problemMessage(problem);
    if (!mark.kinds.includes(problem.kind)) mark.kinds.push(problem.kind);
    if (!mark.messages.includes(message)) mark.messages.push(message);
  }
  return { marks: [...marks.values()], unplaced };
}

const MARKED = 'bg-destructive/10 underline decoration-destructive decoration-wavy';

/**
 * The decorations `marks` put on `doc`: inline over the characters of a range, on each chip a range reaches
 * and on each chip of a named variable. Each is described by its messages, so a screen reader in the text
 * reads them.
 */
export function smsDecorations(doc: ProseMirrorNode, marks: readonly SmsMark[]): Decoration[] {
  if (marks.length === 0) return [];
  const decorations: Decoration[] = [];
  // The body offset of the next character: a variable is its token, and a paragraph ends in a line break.
  let cursor = 0;
  doc.forEach((block, blockOffset, index) => {
    if (index > 0) cursor += 1;
    block.forEach((node, offset) => {
      const from = blockOffset + 1 + offset;
      const length = node.type.name === 'variable' ? String(node.attrs.name).length + 4 : (node.text?.length ?? 1);
      for (const mark of marks) {
        const attrs = { class: MARKED, 'data-problem': mark.kinds.join(' '), 'aria-describedby': mark.id };
        if (node.type.name === 'variable') {
          const named = mark.name === node.attrs.name;
          const reached = mark.range && mark.range.from < cursor + length && mark.range.to > cursor;
          if (named || reached) decorations.push(Decoration.node(from, from + node.nodeSize, attrs));
        } else if (node.isText && mark.range) {
          const start = Math.max(mark.range.from, cursor);
          const end = Math.min(mark.range.to, cursor + length);
          if (start < end) decorations.push(Decoration.inline(from + start - cursor, from + end - cursor, attrs));
        }
      }
      cursor += length;
    });
  });
  return decorations;
}
