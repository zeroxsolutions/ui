/**
 * The inline markup a text field may carry: `**bold**`, `_italic_` and `[label]({{name}})`. A field stays
 * a string, so the markup is a grammar over it that a template validates, a renderer draws and a
 * translation is checked against.
 */
import { VARIABLE_TOKEN } from '../variables/variable-tokens.js';

export interface InlineText {
  readonly kind: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export interface InlineLink {
  readonly kind: 'link';
  readonly variable: string;
  readonly label: readonly InlineText[];
}

export type InlineRun = InlineText | InlineLink;

export type InlineMarkupProblem =
  | 'marker-unclosed'
  | 'marker-inside-token'
  | 'marker-ambiguous'
  | 'link-unclosed'
  | 'link-target-not-one-token'
  | 'link-label-empty'
  | 'link-nested';

export type ParsedInlineMarkup =
  | { readonly ok: true; readonly runs: readonly InlineRun[] }
  | { readonly ok: false; readonly problem: InlineMarkupProblem; readonly offset: number };

type Refusal = Extract<ParsedInlineMarkup, { ok: false }>;

/** A text run as the parse builds it: `at[i]` is where `text[i]` sits in the source. */
interface DraftText extends InlineText {
  readonly at: readonly number[];
}

type DraftRun = DraftText | { readonly kind: 'link'; readonly variable: string; readonly label: readonly DraftText[] };

interface Seen {
  readonly tokens: Set<number>;
  readonly markers: number[];
}

type ParsedDraft = { readonly ok: true; readonly runs: readonly DraftRun[] } | Refusal;

/** Sticky, so a token is read at one position without scanning ahead; the shared global one cannot be. */
const TOKEN_HERE = new RegExp(VARIABLE_TOKEN.source, 'y');
const LINK_TARGET = /^\(\{\{(\w+)\}\}\)/;
const ESCAPABLE = '*_[]\\';

/** Adds a text run, joining it to the one before when their marks match, so merged runs print and parse back unchanged. */
function pushText<T extends DraftRun>(runs: (DraftText | T)[], run: DraftText): void {
  const last = runs.at(-1);
  if (last?.kind === 'text' && last.bold === run.bold && last.italic === run.italic) {
    runs[runs.length - 1] = { ...last, text: last.text + run.text, at: [...last.at, ...run.at] };
  } else {
    runs.push(run);
  }
}

function refuse(problem: InlineMarkupProblem, offset: number): Refusal {
  return { ok: false, problem, offset };
}

function tokenAt(source: string, index: number): string | undefined {
  TOKEN_HERE.lastIndex = index;
  return TOKEN_HERE.exec(source)?.[0];
}

/** Whether a `\\` at `index` escapes the character after it; a `\\` that ends the source is text. */
function escapedAt(source: string, index: number): boolean {
  return source[index] === '\\' && index + 1 < source.length && ESCAPABLE.includes(source[index + 1]);
}

/** The index of the `]` that closes a label opened before `from`, or the refusal that stops the search. */
function labelEnd(source: string, from: number, base: number): number | Refusal {
  let index = from;
  while (index < source.length) {
    const token = tokenAt(source, index);
    if (token) index += token.length;
    else if (escapedAt(source, index)) index += 2;
    else if (source[index] === '[') return refuse('link-nested', base + index);
    else if (source[index] === ']') return index;
    else index += 1;
  }
  return refuse('link-unclosed', base + from - 1);
}

/**
 * Whole-string parse; `base` is where `source` starts in the string the caller was given, for offsets.
 * `seen` collects the offset of every token read whole and of every marker.
 */
function parseRuns(source: string, base: number, seen: Seen): ParsedDraft {
  const runs: DraftRun[] = [];
  let buffer = '';
  let at: number[] = [];
  let bold = -1;
  let italic = -1;

  const flush = (): void => {
    if (buffer === '') return;
    pushText(runs, { kind: 'text', text: buffer, bold: bold >= 0, italic: italic >= 0, at });
    buffer = '';
    at = [];
  };
  const take = (text: string, from: number): void => {
    buffer += text;
    for (let i = 0; i < text.length; i += 1) at.push(from + i);
  };

  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const token = tokenAt(source, index);
    if (token) {
      seen.tokens.add(base + index);
      take(token, base + index);
      index += token.length;
    } else if (escapedAt(source, index)) {
      take(source[index + 1], base + index + 1);
      index += 2;
    } else if (char === '*' && source[index + 1] === '*') {
      flush();
      seen.markers.push(base + index);
      bold = bold >= 0 ? -1 : base + index;
      index += 2;
    } else if (char === '_') {
      flush();
      seen.markers.push(base + index);
      italic = italic >= 0 ? -1 : base + index;
      index += 1;
    } else if (char === '[') {
      const end = labelEnd(source, index + 1, base);
      if (typeof end !== 'number') return end;
      const label = parseRuns(source.slice(index + 1, end), base + index + 1, seen);
      if (!label.ok) return label;
      if (label.runs.length === 0) return refuse('link-label-empty', base + index);
      const target = LINK_TARGET.exec(source.slice(end + 1));
      if (!target) return refuse('link-target-not-one-token', base + end + 1);
      flush();
      // A mark opened around the link belongs to the label, the one place a link's text lives.
      const folded: DraftText[] = [];
      for (const run of label.runs as readonly DraftText[]) {
        pushText(folded, { ...run, bold: run.bold || bold >= 0, italic: run.italic || italic >= 0 });
      }
      runs.push({ kind: 'link', variable: target[1], label: folded });
      index = end + 1 + target[0].length;
    } else {
      take(char, base + index);
      index += 1;
    }
  }
  flush();

  const open = [bold, italic].filter((offset) => offset >= 0);
  if (open.length > 0) return refuse('marker-unclosed', Math.min(...open));
  return { ok: true, runs };
}

/**
 * Where the first `{{name}}` a run's text spells sits in the source, if the scan did not read that token
 * whole there: markers dropped and escapes resolved, the text around a marker can join into a name the
 * source never spelled, and the renderer fills each run's tokens. A token read whole always stays one
 * token in its run, so comparing counts finds every joined one.
 */
function joinedToken(runs: readonly DraftRun[], tokens: Set<number>): number | undefined {
  const texts = runs.flatMap((run) => (run.kind === 'text' ? [run] : run.label));
  const starts = texts.flatMap((run) => Array.from(run.text.matchAll(VARIABLE_TOKEN), (match) => run.at[match.index]));
  if (starts.length === tokens.size) return undefined;
  const joined = starts.filter((start) => !tokens.has(start));
  return joined.length > 0 ? Math.min(...joined) : 0;
}

function published(run: DraftText): InlineText {
  return { kind: 'text', text: run.text, bold: run.bold, italic: run.italic };
}

/** The parse without the print-back check: every rule but `marker-ambiguous`. */
function parseOnce(source: string): ParsedInlineMarkup & { readonly markers?: readonly number[] } {
  const seen: Seen = { tokens: new Set(), markers: [] };
  const parsed = parseRuns(source, 0, seen);
  if (!parsed.ok) return parsed;
  const joined = joinedToken(parsed.runs, seen.tokens);
  if (joined !== undefined) return refuse('marker-inside-token', joined);
  return {
    ok: true,
    markers: seen.markers,
    runs: parsed.runs.map((run) =>
      run.kind === 'text' ? published(run) : { kind: 'link', variable: run.variable, label: run.label.map(published) },
    ),
  };
}

/**
 * Reads `source` into runs, or says what is wrong with it and where. A source is accepted only when its
 * runs print to a source that parses back to the same runs: a marker printed beside a token's braces can
 * otherwise read as part of a name (`_{{a**_**b}}` prints `_{{a_b}}`), so a translation or an editor that
 * prints the runs would change what the renderer fills.
 */
export function parseInlineMarkup(source: string): ParsedInlineMarkup {
  const parsed = parseOnce(source);
  if (!parsed.ok) return parsed;
  const runs = parsed.runs;
  const again = parseOnce(printInlineMarkup(runs));
  if (!again.ok || JSON.stringify(again.runs) !== JSON.stringify(runs)) {
    return refuse('marker-ambiguous', parsed.markers?.[0] ?? 0);
  }
  return { ok: true, runs };
}

/** Text with its markers escaped, a `{{name}}` token left whole so the `_` inside it is not escaped. */
function escapeText(text: string): string {
  let out = '';
  let index = 0;
  while (index < text.length) {
    const token = tokenAt(text, index);
    if (token) {
      out += token;
      index += token.length;
    } else {
      out += ESCAPABLE.includes(text[index]) ? `\\${text[index]}` : text[index];
      index += 1;
    }
  }
  return out;
}

type Mark = 'bold' | 'italic';

const MARKS: readonly Mark[] = ['bold', 'italic'];
const MARKER: Readonly<Record<Mark, string>> = { bold: '**', italic: '_' };

/**
 * The markers that turn the marks in `open` (in the order they opened, updated in place) into `wanted`:
 * the unwanted closed innermost first, then the missing opened. Nothing is printed for a mark already in
 * its state, so no span is ever empty or closed and reopened at the same place.
 */
function turnTo(open: Mark[], wanted: readonly Mark[]): string {
  let out = '';
  for (const mark of [...open].reverse()) {
    if (!wanted.includes(mark)) {
      open.splice(open.indexOf(mark), 1);
      out += MARKER[mark];
    }
  }
  for (const mark of wanted) {
    if (!open.includes(mark)) {
      open.push(mark);
      out += MARKER[mark];
    }
  }
  return out;
}

/** Text runs, each with the marks it carries beyond `outer`, which are already on around them. */
function printTexts(runs: readonly InlineText[], open: Mark[], outer: readonly Mark[]): string {
  let out = '';
  for (const run of runs) {
    if (run.text === '') continue;
    out += turnTo(
      open,
      MARKS.filter((mark) => run[mark] && !outer.includes(mark)),
    );
    out += escapeText(run.text);
  }
  return out;
}

/**
 * The source for `runs`. A mark every run of a link's label carries prints around the link, which the
 * parse folds back into the label. The print parses back to `runs` only for runs a parse produced: runs a
 * caller builds itself (an empty label, a run ending `{{a` beside one starting `b}}`) may print a source
 * the parser refuses or reads differently, so a caller should parse what it prints.
 */
export function printInlineMarkup(runs: readonly InlineRun[]): string {
  const open: Mark[] = [];
  let out = '';
  for (const run of runs) {
    if (run.kind === 'text') {
      out += printTexts([run], open, []);
      continue;
    }
    const outer = MARKS.filter((mark) => run.label.every((part) => part[mark]));
    const inside: Mark[] = [];
    const label = printTexts(run.label, inside, outer) + turnTo(inside, []);
    out += `${turnTo(open, outer)}[${label}]({{${run.variable}}})`;
  }
  return out + turnTo(open, []);
}

function plainRuns(runs: readonly InlineRun[]): string {
  return runs.map((run) => (run.kind === 'text' ? run.text : run.label.map((part) => part.text).join(''))).join('');
}

/** What a reader sees: markers dropped, escapes resolved, a link as its label. A malformed source is returned as written. */
export function plainInlineText(source: string): string {
  const parsed = parseInlineMarkup(source);
  return parsed.ok ? plainRuns(parsed.runs) : source;
}

/**
 * One entry per bold span, italic span and link, or undefined when `source` is malformed. A span is
 * counted where its mark turns on along the flat text, a link's label included, so a span that wraps a
 * link or a word counts once however the runs inside it split.
 */
function marks(source: string): string | undefined {
  const parsed = parseInlineMarkup(source);
  if (!parsed.ok) return undefined;
  const entries: string[] = [];
  let bold = false;
  let italic = false;
  for (const run of parsed.runs) {
    if (run.kind === 'link') entries.push(`link:${run.variable}`);
    for (const text of run.kind === 'text' ? [run] : run.label) {
      if (text.bold && !bold) entries.push('bold');
      if (text.italic && !italic) entries.push('italic');
      bold = text.bold;
      italic = text.italic;
    }
  }
  return entries.sort().join('\n');
}

/**
 * Whether `translation` carries the bold spans, italic spans and links `source` does; their order within
 * a text is not compared, and a malformed side is never the same. A list compares item by item, in order,
 * and must have as many items; a string compares as a list of one. Pass only marked text, never a whole
 * block's content: a button label, code or html is plain, and one stray `_` in it would refuse both sides.
 */
export function sameInlineMarkup(source: string | readonly string[], translation: string | readonly string[]): boolean {
  const left = typeof source === 'string' ? [source] : source;
  const right = typeof translation === 'string' ? [translation] : translation;
  if (left.length !== right.length) return false;
  return left.every((text, index) => {
    const leftMarks = marks(text);
    return leftMarks !== undefined && leftMarks === marks(right[index]);
  });
}
