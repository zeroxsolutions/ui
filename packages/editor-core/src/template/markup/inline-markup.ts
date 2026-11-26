/**
 * The inline markup a text field may carry: `**bold**`, `_italic_`, `[label](href)`, the href any text
 * that may hold `{{name}}` tokens, and `{color=<token>}text{/color}` and `{bg=<token>}text{/bg}`. A field stays
 * a string, so the markup is a grammar over it that a template validates, a renderer draws and a
 * translation is checked against.
 */
import { COLOR_TOKENS, type ColorToken } from '../layout/index.js';
import { VARIABLE_TOKEN, variableTokens } from '../variables/variable-tokens.js';

export interface InlineText {
  readonly kind: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
  /** The text's colour; absent for the default colour, which no marker names. */
  readonly color?: ColorToken;
  /** The colour behind the text; absent for none. */
  readonly background?: ColorToken;
}

/** A link; `href` is the target as written, tokens unfilled, escapes resolved, and may be empty. */
export interface InlineLink {
  readonly kind: 'link';
  readonly href: string;
  readonly label: readonly InlineText[];
}

export type InlineRun = InlineText | InlineLink;

export type InlineMarkupProblem =
  | 'marker-unclosed'
  | 'marker-inside-token'
  | 'marker-ambiguous'
  | 'link-unclosed'
  | 'link-target-missing'
  | 'link-label-empty'
  | 'link-nested'
  | 'color-unclosed'
  | 'color-token-unknown'
  | 'color-nested';

export type ParsedInlineMarkup =
  | { readonly ok: true; readonly runs: readonly InlineRun[] }
  | { readonly ok: false; readonly problem: InlineMarkupProblem; readonly offset: number };

type Refusal = Extract<ParsedInlineMarkup, { ok: false }>;

/** A text run as the parse builds it: `at[i]` is where `text[i]` sits in the source. */
interface DraftText extends InlineText {
  readonly at: readonly number[];
}

type DraftRun = DraftText | { readonly kind: 'link'; readonly href: string; readonly label: readonly DraftText[] };

/** The colour and background a run is painted in. */
interface Paint {
  readonly color?: ColorToken;
  readonly background?: ColorToken;
}

/** A colour marker's field in a run, by the name the marker spells. */
const PAINT_FIELDS = { color: 'color', bg: 'background' } as const satisfies Record<string, keyof Paint>;
type PaintMarker = keyof typeof PAINT_FIELDS;

/** The colours a marker may name: every token but `default`, which is the absence of a marker. */
const MARKER_COLORS: readonly string[] = COLOR_TOKENS.filter((token) => token !== 'default');

/**
 * `{color=<word>}`, `{bg=<word>}`, `{/color}` or `{/bg}` exactly, sticky. Any other `{` is literal text, so a
 * brace an older string spells (`{b}`, `{ color=red }`) reads as it always did.
 */
const PAINT_MARKER_HERE = /\{(?:(color|bg)=([a-z]+)|\/(color|bg))\}/y;

interface PaintMarkerAt {
  readonly marker: PaintMarker;
  /** The colour an opening marker names, as written; absent on a closing one. */
  readonly token?: string;
  readonly length: number;
}

function paintMarkerAt(source: string, index: number): PaintMarkerAt | undefined {
  PAINT_MARKER_HERE.lastIndex = index;
  const match = PAINT_MARKER_HERE.exec(source);
  if (match === null) return undefined;
  const opening = match[1] as PaintMarker | undefined;
  return opening === undefined
    ? { marker: match[3] as PaintMarker, length: match[0].length }
    : { marker: opening, token: match[2], length: match[0].length };
}

interface Seen {
  readonly tokens: Set<number>;
  readonly markers: number[];
}

type ParsedDraft = { readonly ok: true; readonly runs: readonly DraftRun[] } | Refusal;

/** Sticky, so a token is read at one position without scanning ahead; the shared global one cannot be. */
const TOKEN_HERE = new RegExp(VARIABLE_TOKEN.source, 'y');
const ESCAPABLE = '*_[]\\';
/** What a `\\` escapes inside an href: the `)` that would end it, and itself. Every other character there is literal. */
const HREF_ESCAPABLE = ')\\';

function sameLook(left: InlineText, right: InlineText): boolean {
  return (
    left.bold === right.bold &&
    left.italic === right.italic &&
    left.color === right.color &&
    left.background === right.background
  );
}

/** Adds a text run, joining it to the one before when their marks match, so merged runs print and parse back unchanged. */
function pushText<T extends DraftRun>(runs: (DraftText | T)[], run: DraftText): void {
  const last = runs.at(-1);
  if (last?.kind === 'text' && sameLook(last, run)) {
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

/**
 * Whether a `\\` at `index` escapes the character after it: a marker character, or a `{` that opens a colour
 * marker. A `\\` that ends the source, or comes before any other character, is text.
 */
function escapedAt(source: string, index: number): boolean {
  if (source[index] !== '\\' || index + 1 >= source.length) return false;
  return ESCAPABLE.includes(source[index + 1]) || paintMarkerAt(source, index + 1) !== undefined;
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

/** The href of a target opening with the `(` at `from`, and the index after its `)`, or the refusal that stops the search. */
function hrefAt(source: string, from: number, base: number): { href: string; end: number } | Refusal {
  if (source[from] !== '(') return refuse('link-target-missing', base + from);
  let href = '';
  let index = from + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\' && index + 1 < source.length && HREF_ESCAPABLE.includes(source[index + 1])) {
      href += source[index + 1];
      index += 2;
    } else if (char === ')') {
      return { href, end: index + 1 };
    } else {
      href += char;
      index += 1;
    }
  }
  return refuse('link-unclosed', base + from);
}

/** A colour marker opened in this parse: the colour it names and where it opened. */
interface OpenPaint {
  readonly token: ColorToken;
  readonly offset: number;
}

/**
 * Whole-string parse; `base` is where `source` starts in the string the caller was given, for offsets.
 * `seen` collects the offset of every token read whole and of every marker. `outer` is the paint a link's
 * label sits in, which a marker in the label may not open again.
 */
function parseRuns(source: string, base: number, seen: Seen, outer: Paint = {}): ParsedDraft {
  const runs: DraftRun[] = [];
  let buffer = '';
  let at: number[] = [];
  let bold = -1;
  let italic = -1;
  const paint: Partial<Record<PaintMarker, OpenPaint>> = {};

  const painted = (): Paint => ({
    ...(paint.color === undefined ? {} : { color: paint.color.token }),
    ...(paint.bg === undefined ? {} : { background: paint.bg.token }),
  });
  const flush = (): void => {
    if (buffer === '') return;
    pushText(runs, { kind: 'text', text: buffer, bold: bold >= 0, italic: italic >= 0, ...painted(), at });
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
    const marker = token ? undefined : paintMarkerAt(source, index);
    if (marker) {
      flush();
      seen.markers.push(base + index);
      if (marker.token === undefined) {
        if (paint[marker.marker] === undefined) return refuse('color-unclosed', base + index);
        delete paint[marker.marker];
      } else {
        if (!MARKER_COLORS.includes(marker.token)) return refuse('color-token-unknown', base + index);
        if (paint[marker.marker] !== undefined || outer[PAINT_FIELDS[marker.marker]] !== undefined) {
          return refuse('color-nested', base + index);
        }
        paint[marker.marker] = { token: marker.token as ColorToken, offset: base + index };
      }
      index += marker.length;
    } else if (token) {
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
      const label = parseRuns(source.slice(index + 1, end), base + index + 1, seen, { ...outer, ...painted() });
      if (!label.ok) return label;
      if (label.runs.length === 0) return refuse('link-label-empty', base + index);
      const target = hrefAt(source, end + 1, base);
      if ('ok' in target) return target;
      flush();
      // A mark or a colour opened around the link belongs to the label, the one place a link's text lives.
      const folded: DraftText[] = [];
      for (const run of label.runs as readonly DraftText[]) {
        pushText(folded, { ...run, bold: run.bold || bold >= 0, italic: run.italic || italic >= 0, ...painted() });
      }
      runs.push({ kind: 'link', href: target.href, label: folded });
      index = target.end;
    } else {
      take(char, base + index);
      index += 1;
    }
  }
  flush();

  const open = [bold, italic].filter((offset) => offset >= 0);
  if (open.length > 0) return refuse('marker-unclosed', Math.min(...open));
  const openPaint = [paint.color, paint.bg].flatMap((opened) => (opened === undefined ? [] : [opened.offset]));
  if (openPaint.length > 0) return refuse('color-unclosed', Math.min(...openPaint));
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
  return {
    kind: 'text',
    text: run.text,
    bold: run.bold,
    italic: run.italic,
    ...(run.color === undefined ? {} : { color: run.color }),
    ...(run.background === undefined ? {} : { background: run.background }),
  };
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
      run.kind === 'text' ? published(run) : { kind: 'link', href: run.href, label: run.label.map(published) },
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

/**
 * Text with its markers escaped, and each `{` that would open a colour marker, a `{{name}}` token left whole so
 * the `_` inside it is not escaped.
 */
function escapeText(text: string): string {
  let out = '';
  let index = 0;
  while (index < text.length) {
    const token = tokenAt(text, index);
    if (token) {
      out += token;
      index += token.length;
    } else {
      const escaped = ESCAPABLE.includes(text[index]) || paintMarkerAt(text, index) !== undefined;
      out += escaped ? `\\${text[index]}` : text[index];
      index += 1;
    }
  }
  return out;
}

/** An href with the characters that would end it or read as an escape escaped; its tokens hold neither. */
function escapeHref(href: string): string {
  return href.replace(/[)\\]/g, (char) => `\\${char}`);
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

/** What a print has open: the marks in the order they opened, and the paint. Updated in place. */
interface Printing {
  readonly marks: Mark[];
  color?: ColorToken;
  background?: ColorToken;
}

/**
 * The markers that turn the paint open in `printing` into `wanted`. Colour markers nest, a background outside a
 * colour, and the marks open inside both, so a change closes the marks and every colour marker inside the one that
 * changed; the caller's next `turnTo` reopens the marks.
 */
function paintTo(printing: Printing, wanted: Paint): string {
  const background = printing.background !== wanted.background;
  const color = printing.color !== wanted.color || (background && printing.color !== undefined);
  if (!background && !color) return '';
  let out = turnTo(printing.marks, []);
  if (color && printing.color !== undefined) {
    out += '{/color}';
    printing.color = undefined;
  }
  if (background && printing.background !== undefined) {
    out += '{/bg}';
    printing.background = undefined;
  }
  if (printing.background !== wanted.background && wanted.background !== undefined) {
    out += `{bg=${wanted.background}}`;
    printing.background = wanted.background;
  }
  if (printing.color !== wanted.color && wanted.color !== undefined) {
    out += `{color=${wanted.color}}`;
    printing.color = wanted.color;
  }
  return out;
}

/** The markers that close everything `printing` has open. */
function closeAll(printing: Printing): string {
  return turnTo(printing.marks, []) + paintTo(printing, {});
}

/** The paint every run of `label` carries, which prints around the link. */
function sharedPaint(label: readonly InlineText[]): Paint {
  const first = label[0];
  const color = first !== undefined && label.every((part) => part.color === first.color) ? first.color : undefined;
  const background =
    first !== undefined && label.every((part) => part.background === first.background) ? first.background : undefined;
  return { ...(color === undefined ? {} : { color }), ...(background === undefined ? {} : { background }) };
}

/** Text runs, each with the marks and paint it carries beyond `outer` and `outerPaint`, already on around them. */
function printTexts(
  runs: readonly InlineText[],
  printing: Printing,
  outer: readonly Mark[],
  outerPaint: Paint,
): string {
  let out = '';
  for (const run of runs) {
    if (run.text === '') continue;
    out += paintTo(printing, {
      ...(run.color === outerPaint.color ? {} : { color: run.color }),
      ...(run.background === outerPaint.background ? {} : { background: run.background }),
    });
    out += turnTo(
      printing.marks,
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
  const printing: Printing = { marks: [] };
  let out = '';
  for (const run of runs) {
    if (run.kind === 'text') {
      out += printTexts([run], printing, [], {});
      continue;
    }
    const outer = MARKS.filter((mark) => run.label.every((part) => part[mark]));
    const outerPaint = sharedPaint(run.label);
    const inside: Printing = { marks: [] };
    const label = printTexts(run.label, inside, outer, outerPaint) + closeAll(inside);
    out += `${paintTo(printing, outerPaint)}${turnTo(printing.marks, outer)}[${label}](${escapeHref(run.href)})`;
  }
  return out + closeAll(printing);
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
 * One entry per bold span, italic span, colour span and link, or undefined when `source` is malformed. A span is
 * counted where its mark turns on along the flat text, a link's label included, so a span that wraps a
 * link or a word counts once however the runs inside it split. A link is entered by the tokens its href
 * spells, not its fixed text, so a translation may point it at a page in its own language.
 */
function marks(source: string): string | undefined {
  const parsed = parseInlineMarkup(source);
  if (!parsed.ok) return undefined;
  const entries: string[] = [];
  let bold = false;
  let italic = false;
  let color: ColorToken | undefined;
  let background: ColorToken | undefined;
  for (const run of parsed.runs) {
    if (run.kind === 'link') entries.push(`link:${variableTokens(run.href).join(' ')}`);
    for (const text of run.kind === 'text' ? [run] : run.label) {
      if (text.bold && !bold) entries.push('bold');
      if (text.italic && !italic) entries.push('italic');
      if (text.color !== undefined && text.color !== color) entries.push(`color:${text.color}`);
      if (text.background !== undefined && text.background !== background) entries.push(`bg:${text.background}`);
      bold = text.bold;
      italic = text.italic;
      color = text.color;
      background = text.background;
    }
  }
  return entries.sort().join('\n');
}

/**
 * Whether `translation` carries the bold spans, italic spans, colour spans and links `source` does, each link with the
 * tokens its href spells; their order within a text is not compared, and a malformed side is never the
 * same. A list compares item by item, in order, and must have as many items; a string compares as a list
 * of one. Pass only marked text, never a whole block's content: a button label, code or html is plain, and
 * one stray `_` in it would refuse both sides.
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
