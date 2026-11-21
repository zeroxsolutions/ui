import type { ProblemKind, ProfileProblem } from '@zeroxsolutions/editor-core/profiles/index';
import type { RenderProblem, RenderProblemKind } from '@zeroxsolutions/editor-core/template/email/index';

/** What each problem says to the author, in one place so a host can later replace the wording. */
export const PROBLEM_MESSAGES: Readonly<Record<ProblemKind, string>> = {
  'variable-undeclared': 'This variable is not declared',
  'href-not-url-variable': 'The link must be one link variable',
  'link-not-url-variable': 'A link can only point to a link variable',
  'required-variable-not-printed': 'A required variable is not used',
  'markup-malformed': 'The formatting is not closed',
  'block-not-allowed': 'This block is not allowed here',
  'unknown-block-type': 'This block is of an unknown type',
  'block-nested-too-deep': 'Columns cannot hold columns',
  'lanes-mismatch': 'The columns do not match their widths',
  'text-empty': 'This block is empty',
  'text-too-long': 'This text is too long',
  'list-too-long': 'This list has too many items',
  'too-many-blocks': 'The email has too many blocks',
  'sms-segment-exceeded': 'The message is longer than allowed',
  'sms-placeholder-malformed': 'A variable is not closed',
};

/** The message `problem` reads as, naming the variable it is about. */
export function problemMessage(problem: ProfileProblem): string {
  const message = PROBLEM_MESSAGES[problem.kind];
  return problem.name === undefined ? message : `${message}: {{${problem.name}}}`;
}

/** What each problem the renderer met while drawing the preview says to the author. */
export const RENDER_PROBLEM_MESSAGES: Readonly<Record<RenderProblemKind, string>> = {
  'variable-missing': 'This variable has no sample value to preview',
  'href-not-url-variable': 'The link must be one link variable',
  'href-scheme-refused': 'The link is not a web or mail address',
  'unknown-block-type': 'This block is of an unknown type',
  'block-nested-too-deep': 'Columns cannot hold columns',
};

/**
 * The message a render problem reads as, naming its variable or block type and where it is: a region of the
 * layout, the subject or preheader, or `block`, the place in the document of the block it names.
 */
export function renderProblemMessage(problem: RenderProblem, block?: number): string {
  const message = RENDER_PROBLEM_MESSAGES[problem.kind];
  const named =
    problem.name === undefined
      ? ''
      : problem.kind === 'unknown-block-type'
        ? `: ${problem.name}`
        : `: {{${problem.name}}}`;
  const where =
    problem.region !== undefined
      ? ` (in the ${problem.region})`
      : problem.blockId === null
        ? ' (in the subject or preheader)'
        : block !== undefined
          ? ` (block ${block})`
          : '';
  return `${message}${named}${where}`;
}
