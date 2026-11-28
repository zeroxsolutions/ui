import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const BASES = join(ROOT, 'registry/bases');

/** Each stylesheet under `registry/bases`, which ships as-is to every style; the style sheets live elsewhere. */
function sheets(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sheets(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

interface Declaration {
  /** The rule's selector, with the at-rules it nests in before it, on one line. */
  rule: string;
  property: string;
  value: string;
}

/** Every declaration of a sheet, with the rule it sits in; comments and strings are read past. */
function declarations(source: string): Declaration[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: Declaration[] = [];
  const stack: string[] = [];
  let buffer = '';
  const flush = () => {
    const statement = buffer.trim();
    buffer = '';
    const colon = statement.indexOf(':');
    if (stack.length === 0 || colon < 0 || statement.startsWith('@')) return;
    found.push({
      rule: stack.join(' > '),
      property: statement.slice(0, colon).trim(),
      value: statement.slice(colon + 1).trim(),
    });
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' || char === "'") {
      const end = text.indexOf(char, index + 1);
      buffer += text.slice(index, end + 1);
      index = end;
    } else if (char === '{') {
      stack.push(buffer.replace(/\s+/g, ' ').trim());
      buffer = '';
    } else if (char === ';') {
      flush();
    } else if (char === '}') {
      flush();
      stack.pop();
    } else {
      buffer += char;
    }
  }
  return found;
}

/**
 * The rules that define the theme's tokens rather than draw anything: the base sheet's `:root` and `.dark`, and
 * Tailwind's `@theme`. A colour there is a token every other rule reads.
 */
function definesTheme(rule: string): boolean {
  return /^(:root|\.dark|@theme\b)/.test(rule);
}

/** Each property a style decides for what it draws, and the declarations that set it. */
const STYLE_DECIDED: [property: string, pattern: RegExp][] = [
  ['padding', /^padding(-|$)/],
  ['gap', /^(gap|row-gap|column-gap)$/],
  ['radius', /^border(-[a-z]+)*-radius$/],
  ['border', /^border(-(top|right|bottom|left|inline|block)(-(start|end))?)?(-(width|style))?$/],
  ['ring', /^outline(-width|-style)?$/],
  ['shadow', /^box-shadow$/],
  ['text size', /^font-size$/],
  ['font weight', /^font-weight$/],
  ['tracking', /^letter-spacing$/],
  ['height', /^(min-)?height$/],
  ['background', /^background(-color)?$/],
  ['text colour', /^(color|accent-color)$/],
];

const LENGTH = /(^|[^\w.-])-?(\d*\.)?\d+(px|rem|em|ch|ex|vw|vh|vmin|vmax)\b/g;
const COLOUR = /\b(oklch|oklab|rgba?|hsla?|hwb|lab|lch)\(|#[0-9a-f]{3,8}\b/i;
const LINE_STYLE = /\b(dashed|dotted|double|groove|ridge|inset|outset)\b/;

/**
 * `value` with each `var()` read as its fallback, or as nothing where it has none: a variable is the token or the
 * style's slot deciding, and only what is written around it is this sheet's own.
 */
function own(value: string): string {
  let result = value;
  for (let match = /var\(\s*--[\w-]+\s*(,)?/.exec(result); match; match = /var\(\s*--[\w-]+\s*(,)?/.exec(result)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (end < result.length && depth > 0) {
      if (result[end] === '(') depth++;
      else if (result[end] === ')') depth--;
      end++;
    }
    const fallback = match[1] ? result.slice(match.index + match[0].length, end - 1) : '';
    result = result.slice(0, match.index) + fallback + result.slice(end);
  }
  return result;
}

/**
 * What a declaration hard-codes that a style decides, if anything: a length, a line style, a weight, or a colour
 * past the theme's tokens. A hairline border is none, since every style draws its borders at 1px; a ring's width
 * and a shadow's are, since the styles' rings differ.
 */
function literal(property: string, value: string): string | undefined {
  const written = own(value);
  if (property.startsWith('--')) return COLOUR.test(written) ? 'colour' : undefined;
  const decided = STYLE_DECIDED.find(([, pattern]) => pattern.test(property))?.[0];
  if (!decided) return undefined;
  if (decided === 'background' || decided === 'text colour') return COLOUR.test(written) ? decided : undefined;
  if (decided === 'font weight') return /\b\d+\b|\b(bold|bolder|lighter)\b/.test(written) ? decided : undefined;
  if ((decided === 'border' || decided === 'ring') && LINE_STYLE.test(written)) return decided;
  const lengths = [...written.matchAll(LENGTH)].map((match) => match[0].replace(/^[^\d.-]/, ''));
  const hairline = decided === 'border';
  return lengths.some((length) => !(hairline && length === '1px')) ? decided : undefined;
}

/**
 * The literals kept on purpose, each `<sheet>: <rule> { <property> }`, with why no style decides it. A value the
 * email draws at a fixed size stays that size here, so the email editor shows what is sent.
 */
const KEPT: Record<string, string> = {
  // `SECTION_PADDING_PX` in editor-core's email template: the padding an author picks, drawn as the email draws it.
  "base-ui/editor/styles.css: .document-editor [data-slot='section'] { padding }": "the email's medium section padding",
  "base-ui/editor/styles.css: .document-editor [data-slot='section'][data-padding='small'] { padding }":
    "the email's small section padding",
  "base-ui/editor/styles.css: .document-editor [data-slot='section'][data-padding='large'] { padding }":
    "the email's large section padding",
  "base-ui/editor/styles.css: .document-editor .ProseMirror[contenteditable='true'] [data-slot='section']:is(:not([data-background]), [data-background='none']) { outline }":
    "the dashed hairline an editable section shows its bounds with, as a columns block's lanes do",
  // `LANE_GUTTER` in editor-core's email template.
  "base-ui/editor/styles.css: .document-editor [data-slot='email-block-lanes'] > [data-node-view-content] > [data-node-view-content-react] { gap }":
    'the gutter the email draws between its lanes',
  "base-ui/editor/styles.css: .document-editor p[data-size='lead'] { font-size }":
    'a paragraph size the author picks, relative to the text around it',
  "base-ui/editor/styles.css: .document-editor p[data-size='small'] { font-size }":
    'a paragraph size the author picks, relative to the text around it',
  "base-ui/editor/styles.css: [data-slot='section-swatch'] { height }":
    "a swatch at the size of the icon beside it in a toolbar's toggle",
  "base-ui/editor/styles.css: [data-slot='color-menu-swatch'] { height }":
    "a swatch at the size of the icon beside it in a toolbar's toggle",
  "base-ui/editor/styles.css: [data-slot='color-menu-swatch'] { font-weight }": "the letter drawn as a swatch's glyph",
  // A highlight's padding widens the run it sits on, so a chip's would push the words apart as they are typed.
  'base-ui/editor/styles.css: .variable-text-field .slash-active { padding }':
    'a hair of room round a highlight in a line',
  'base-ui/editor/styles.css: @layer components > .document-editor .slash-active { padding }':
    'a hair of room round a highlight in a line',
  'base-ui/editor/styles.css: @layer components > .chat-composer .slash-active { padding }':
    'a hair of room round a highlight in a line',
  'base-ui/editor/styles.css: @layer components > .document-editor mark { padding }':
    'a hair of room round a highlight in a line',
  // The drag handle extension places its handle a fixed distance left of each block.
  "base-ui/editor/styles.css: @layer components > .document-editor .ProseMirror[contenteditable='true'] { padding-inline }":
    'the gutter the drag handle is placed in',
  'base-ui/editor/styles.css: @layer components > .drag-handle { height }': 'the handle sized to the gutter it sits in',
  "base-ui/editor/styles.css: .chat-composer [data-slot='command'] { box-shadow }":
    "a hairline drawn inside a pill, so the pill keeps a mention's size",
};

/** Each declaration in a stylesheet under `registry/bases` that hard-codes what a style decides. */
function literals(path: string): string[] {
  return declarations(readFileSync(path, 'utf8')).flatMap(({ rule, property, value }) => {
    if (definesTheme(rule)) return [];
    const decided = literal(property, value);
    return decided ? [`${relative(BASES, path)}: ${rule} { ${property} }`] : [];
  });
}

describe('a stylesheet under registry/bases', () => {
  const found = sheets(BASES).flatMap(literals);

  it("sets what a style decides only through a slot's variable or a theme token", () => {
    expect(found.filter((entry) => !(entry in KEPT))).toEqual([]);
  });

  it('keeps only literals a sheet still writes', () => {
    expect(Object.keys(KEPT).filter((entry) => !found.includes(entry))).toEqual([]);
  });
});

describe('the literal check', () => {
  it.each([
    ['padding', '0.375rem 0.75rem'],
    ['outline', '1px dashed var(--border)'],
    ['outline', '2px solid var(--primary)'],
    ['font-weight', '600'],
    ['box-shadow', 'inset 0 0 0 1px var(--ring)'],
    ['--composer-accent', 'oklch(0.55 0.18 265)'],
    ['gap', 'var(--editor-lane-gap, 0.75rem)'],
  ])('reports %s: %s', (property, value) => {
    expect(literal(property, value)).toBeDefined();
  });

  it.each([
    ['padding', '0'],
    ['padding', 'var(--editor-table-cell-padding)'],
    ['gap', 'calc(var(--spacing) * 2)'],
    ['border', '1px solid var(--border)'],
    ['background', 'color-mix(in oklab, var(--primary) 12%, transparent)'],
    ['font-weight', 'inherit'],
    ['height', '100%'],
    ['margin-top', '0.5rem'],
    ['--layout-bleed', '3rem'],
  ])('passes %s: %s', (property, value) => {
    expect(literal(property, value)).toBeUndefined();
  });
});
