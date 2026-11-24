/**
 * The primitives a render returns instead of HTML: each stands for the mail-client markup it is drawn as, and
 * carries the classes a stylesheet styles it by. Values are filled when a node is made, through the reader
 * its factory was given, and escaped when it is written.
 */
import { escapeHtml } from '../../variables/interpolate.js';

/** One class name, or several, a falsy entry left out, so a render can write `active && 'zx-x'`. */
export type ClassList = string | readonly (string | false | null | undefined)[];

/** A run of filled text, bold and italic as its markup said. */
export interface TextRunText {
  readonly kind: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

/** A link whose href passed the link check; a refused one is read as its label's runs alone. */
export interface TextRunLink {
  readonly kind: 'link';
  readonly href: string;
  readonly label: readonly TextRunText[];
}

export type TextRun = TextRunText | TextRunLink;

/** What follows a node's text on the text arm: a blank line, as after a paragraph, or a line break. */
export type TextEnd = 'paragraph' | 'line';

export interface ColumnNode {
  readonly kind: 'column';
  readonly classes: readonly string[];
  /** Its share of the row against its siblings' weights. */
  readonly weight: number;
  readonly children: readonly EmailNode[];
}

export type EmailNode =
  | { readonly kind: 'section'; readonly classes: readonly string[]; readonly children: readonly EmailNode[] }
  | { readonly kind: 'columns'; readonly classes: readonly string[]; readonly columns: readonly ColumnNode[] }
  | ColumnNode
  | {
      readonly kind: 'text';
      readonly classes: readonly string[];
      readonly runs: readonly TextRun[];
      readonly textEnd: TextEnd;
    }
  | {
      readonly kind: 'heading';
      readonly classes: readonly string[];
      readonly level: 1 | 2 | 3;
      readonly runs: readonly TextRun[];
    }
  /**
   * `href` is null where the link was refused or empty: the button draws with no `href`, since a webmail resolves
   * an empty one to its own page.
   */
  | {
      readonly kind: 'button';
      readonly classes: readonly string[];
      readonly href: string | null;
      readonly label: string;
    }
  | {
      readonly kind: 'image';
      readonly classes: readonly string[];
      readonly src: string;
      readonly alt: string;
      readonly width: number;
      readonly href: string | null;
    }
  | { readonly kind: 'divider'; readonly classes: readonly string[] }
  | {
      readonly kind: 'list';
      readonly classes: readonly string[];
      readonly ordered: boolean;
      readonly items: readonly (readonly TextRun[])[];
    }
  | { readonly kind: 'code'; readonly classes: readonly string[]; readonly text: string }
  | { readonly kind: 'spacer'; readonly classes: readonly string[]; readonly height: number }
  /**
   * Markup written as it is, on no stylesheet's terms, and its text arm. `rows` marks the table rows a render
   * written before there were primitives answers, which a stack of rows holds as they are.
   */
  | { readonly kind: 'raw'; readonly html: string; readonly text: string; readonly rows?: boolean }
  | { readonly kind: 'preheader'; readonly text: string }
  | { readonly kind: 'card'; readonly classes: readonly string[]; readonly children: readonly EmailNode[] }
  | {
      readonly kind: 'region';
      readonly name: string;
      readonly children: readonly EmailNode[];
      readonly textEnd: TextEnd;
    };

/** A child list a render writes, where a falsy entry is left out. */
export type Children = readonly (EmailNode | false | null | undefined)[];

/** How a factory fills what a primitive is given: a block's reads its values and checks its links. */
export interface PrimitiveReader {
  /** The template filled, as plain text. */
  text(template: string): string;
  /** The template read as inline markup, filled. */
  runs(template: string): readonly TextRun[];
  /** The link the template makes, or null where it is refused. */
  href(template: string): string | null;
  /** The template as markup, written as it is with every value escaped. */
  markup(template: string): string;
  /** The image address the template makes, or null where it is refused. */
  imageSrc(template: string): string | null;
}

/** Prints what it is given as it is, every address included. */
export const literalReader: PrimitiveReader = {
  text: (template) => template,
  runs: (template) => (template === '' ? [] : [{ kind: 'text', text: template, bold: false, italic: false }]),
  href: (template) => template,
  markup: (template) => template,
  imageSrc: (template) => template,
};

/** A link a client opens: a page, or an address to write to. */
const LAYOUT_LINK = /^(?:https?:|mailto:)/i;
/** An image a client loads: a page's, one written into the address, as a preview's logo is, or a part of the mail. */
const LAYOUT_IMAGE = /^(?:https?:|data:image\/|cid:)/i;
/**
 * The layout's reader: it prints the product's own props as given, and checks each link's and image's scheme as a
 * block's are checked. A person's value reaches the layout's markup only through a tagged `raw`, which escapes it.
 */
export const layoutReader: PrimitiveReader = {
  ...literalReader,
  href: (template) => (LAYOUT_LINK.test(template.trim()) ? template.trim() : null),
  imageSrc: (template) => (LAYOUT_IMAGE.test(template.trim()) ? template.trim() : null),
};

/** The named entities markup commonly holds; another is left as written. */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  hellip: '\u2026',
  ndash: '\u2013',
  mdash: '\u2014',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '\u00ab',
  raquo: '\u00bb',
  middot: '\u00b7',
  bull: '\u2022',
  euro: '\u20ac',
  pound: '\u00a3',
  yen: '\u00a5',
  cent: '\u00a2',
  deg: '\u00b0',
  times: '\u00d7',
};

/** `html`'s text: its tags dropped, and its numbered entities and the named ones of `ENTITIES` read back. */
function textOf(html: string): string {
  return withoutTags(html).replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, decimal, hex, name) => {
    if (name !== undefined) return ENTITIES[UPPER_CASE_ENTITIES.has(name) ? name.toLowerCase() : name] ?? entity;
    const code = decimal === undefined ? Number.parseInt(hex, 16) : Number.parseInt(decimal, 10);
    // As HTML reads it: no character, a surrogate, or one past Unicode is the replacement character.
    const replaced = code === 0 || (code >= 0xd800 && code <= 0xdfff) || !(code <= 0x10ffff);
    return replaced ? '\ufffd' : String.fromCodePoint(WINDOWS_1252[code] ?? code);
  });
}

/** The characters HTML reads a numbered entity from 128 to 159 as, by Windows-1252; the rest stand for themselves. */
const WINDOWS_1252: Readonly<Record<number, number>> = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178,
};

/** The named entities HTML also reads in upper case; no other is. */
const UPPER_CASE_ENTITIES = new Set(['AMP', 'LT', 'GT', 'QUOT', 'COPY', 'REG']);

/** Why a tagged `raw` refused a value. */
export type MarkupRefusal = 'value-refused' | 'attribute-refused' | 'position-refused';

/**
 * A tagged `raw` value the renderer will not write: one that is not text, a number, null or undefined; one in a
 * quoted attribute that can take a link, a script or a style, where escaping keeps it in the attribute but does
 * not make it safe; or one anywhere else in a tag, or inside a `style` or `script` element.
 */
export class EmailMarkupInvalid extends Error {
  constructor(
    readonly reason: MarkupRefusal,
    readonly detail: string,
  ) {
    super(`Email markup: ${reason} (${detail})`);
    this.name = 'EmailMarkupInvalid';
  }
}

/** The attributes a value may be written into: none takes a link, a script or a style. */
const PLAIN_ATTRIBUTES = new Set([
  'title',
  'alt',
  'class',
  'id',
  'lang',
  'dir',
  'width',
  'height',
  'align',
  'valign',
  'bgcolor',
  'color',
  'border',
  'cellpadding',
  'cellspacing',
  'colspan',
  'rowspan',
  'role',
  'name',
  'value',
  'placeholder',
  'summary',
  'label',
  'abbr',
  'scope',
  'face',
  'size',
]);

function plainAttribute(name: string): boolean {
  return PLAIN_ATTRIBUTES.has(name) || /^(?:aria|data)-[a-z0-9-]+$/.test(name);
}

/** Where the markup written so far ends: in text, or in a quoted value of the attribute named. */
type MarkupPlace =
  | { readonly in: 'text' }
  | { readonly in: 'quoted'; readonly attribute: string }
  | { readonly in: 'other'; readonly what: string };

/**
 * Where `html` ends, read as an HTML tokenizer reads tags: `/` and whitespace part attributes, a quoted value runs
 * to its own quote whatever it holds, a comment to `-->`, and a `style` or `script` element to its end tag.
 */
function placeAtEnd(html: string): MarkupPlace {
  const lower = html.toLowerCase();
  let at = 0;
  for (;;) {
    const open = lower.indexOf('<', at);
    if (open < 0) return { in: 'text' };
    if (lower.startsWith('<!--', open)) {
      const close = lower.indexOf('-->', open + 4);
      if (close < 0) return { in: 'text' };
      at = close + 3;
      continue;
    }
    if (!/[a-z/!?]/.test(lower[open + 1] ?? '')) {
      if (open + 1 >= lower.length) return { in: 'other', what: 'tag' };
      at = open + 1;
      continue;
    }
    // The tag's name, then its attributes, to the `>` outside a quoted value that ends it.
    let index = open + 1;
    while (index < lower.length && !/[\s/>]/.test(lower[index])) index += 1;
    const tag = lower.slice(open + 1, index);
    let ended = false;
    while (index < lower.length && !ended) {
      const char = lower[index];
      if (/[\s/]/.test(char)) {
        index += 1;
        continue;
      }
      if (char === '>') {
        ended = true;
        index += 1;
        break;
      }
      const nameStart = index;
      while (index < lower.length && !/[\s/>=]/.test(lower[index])) index += 1;
      const attribute = lower.slice(nameStart, index);
      while (index < lower.length && /\s/.test(lower[index])) index += 1;
      if (index >= lower.length) return { in: 'other', what: attribute };
      if (lower[index] !== '=') continue;
      index += 1;
      while (index < lower.length && /\s/.test(lower[index])) index += 1;
      if (index >= lower.length) return { in: 'other', what: attribute };
      const quote = lower[index];
      if (quote === '"' || quote === "'") {
        const close = lower.indexOf(quote, index + 1);
        if (close < 0) return { in: 'quoted', attribute };
        index = close + 1;
      } else {
        while (index < lower.length && !/[\s>]/.test(lower[index])) index += 1;
        if (index >= lower.length) return { in: 'other', what: attribute };
      }
    }
    if (!ended) return { in: 'other', what: tag };
    at = index;
    if (tag === 'style' || tag === 'script') {
      const close = lower.indexOf(`</${tag}`, at);
      if (close < 0) return { in: 'other', what: tag };
      at = close;
    }
  }
}

/** `value` as a tagged `raw` writes it after `before`, the markup written so far. */
function interpolated(before: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new EmailMarkupInvalid('value-refused', typeof value);
  }
  const place = placeAtEnd(before);
  if (place.in === 'other') throw new EmailMarkupInvalid('position-refused', place.what);
  if (place.in === 'quoted' && !plainAttribute(place.attribute)) {
    throw new EmailMarkupInvalid('attribute-refused', place.attribute);
  }
  return escapeHtml(String(value));
}

interface Classed {
  readonly class?: ClassList;
}

/** The text a `text` or `heading` primitive holds: inline markup with variables, or plain text with them. */
type TextSource =
  | { readonly markup: string; readonly text?: undefined }
  | { readonly text: string; readonly markup?: undefined };

/** The primitives a render builds its tree from, each filling its values through one reader. */
export interface EmailPrimitives {
  /** A full-width row: in a stack of blocks its own row, elsewhere a table of one cell. */
  section(options: Classed, children: Children): EmailNode;
  /** Lanes side by side, which stack on a narrow screen. */
  columns(options: Classed, columns: readonly ColumnNode[]): EmailNode;
  /** One lane; `weight` is its share against its siblings', 1 when absent. */
  column(options: Classed & { readonly weight?: number }, children: Children): ColumnNode;
  text(options: Classed & TextSource & { readonly textEnd?: TextEnd }): EmailNode;
  heading(options: Classed & TextSource & { readonly level: 1 | 2 | 3 }): EmailNode;
  /** A link drawn as a button; a refused `href` draws it linking nowhere. */
  button(options: Classed & { readonly href: string; readonly label: string }): EmailNode;
  /** An image; a `src` or `href` that is refused draws nothing, or no link. */
  image(
    options: Classed & { readonly src: string; readonly alt: string; readonly width: number; readonly href?: string },
  ): EmailNode;
  divider(options?: Classed): EmailNode;
  /** Each item is inline markup. */
  list(options: Classed & { readonly items: readonly string[]; readonly ordered?: boolean }): EmailNode;
  code(options: Classed & { readonly text: string }): EmailNode;
  /** Vertical space, `height` in px. */
  spacer(options: Classed & { readonly height: number }): EmailNode;
  /**
   * Trusted markup, written as given; never styled. In a block each `{{name}}` in it is filled escaped; in a
   * layout nothing is filled, so it holds only the product's own literal markup. Its text arm is the markup with
   * its tags dropped.
   */
  raw(options: { readonly markup: string }): EmailNode;
  /**
   * Markup from a tagged template, ``h.raw`<td title="${subject}">` ``: the literal parts as `raw` writes its
   * markup, each `{{name}}` in them filled escaped in a block, and every interpolated value escaped and never
   * filled, so a person's value, such as the subject, stays text, or stays inside its attribute. Escaping does not
   * make a link safe, so a link or an image goes through `button`, `image` or `text`.
   *
   * @throws {EmailMarkupInvalid} for a value that is not text, a number, null or undefined (which prints nothing),
   * or one inside an attribute that takes a link, such as `href` or `src`
   */
  raw(strings: TemplateStringsArray, ...values: readonly (string | number | null | undefined)[]): EmailNode;
  /** The inbox line a client shows after the subject, hidden in the email. */
  preheader(options: { readonly text: string }): EmailNode;
  /** The email's card, at most 600px wide, centred on the page. */
  card(options: Classed, children: Children): EmailNode;
  /** A list of blocks the stylesheet selects as `zx-region-<name>`; empty, it draws nothing. */
  region(name: string, children: Children, options?: { readonly textEnd?: TextEnd }): EmailNode;
}

/** The names of `list`, in order, falsy ones left out. */
export function classesOf(list: ClassList | undefined, ...intrinsic: readonly string[]): string[] {
  const given = list === undefined ? [] : typeof list === 'string' ? [list] : list;
  const names = [...intrinsic, ...given]
    .filter((name): name is string => typeof name === 'string' && name !== '')
    .flatMap((name) => name.split(/\s+/))
    .filter((name) => name !== '');
  return [...new Set(names)];
}

function present(children: Children): EmailNode[] {
  return children.filter((child): child is EmailNode => typeof child === 'object' && child !== null);
}

/** The markup with its tags dropped, for the text arm; dropped before values are filled, so a value's own `<` survives. */
function withoutTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/** The primitives filling through `reader`. */
export function createPrimitives(reader: PrimitiveReader): EmailPrimitives {
  const runsOf = (source: TextSource): readonly TextRun[] => {
    if (source.markup !== undefined) return reader.runs(source.markup);
    const text = reader.text(source.text);
    return text === '' ? [] : [{ kind: 'text', text, bold: false, italic: false }];
  };
  return {
    section: (options, children) => ({
      kind: 'section',
      classes: classesOf(options.class),
      children: present(children),
    }),
    columns: (options, columns) => ({ kind: 'columns', classes: classesOf(options.class, 'zx-columns'), columns }),
    column: (options, children) => ({
      kind: 'column',
      classes: classesOf(options.class),
      weight: options.weight ?? 1,
      children: present(children),
    }),
    text: (options) => ({
      kind: 'text',
      classes: classesOf(options.class, 'zx-text'),
      runs: runsOf(options),
      textEnd: options.textEnd ?? 'paragraph',
    }),
    heading: (options) => ({
      kind: 'heading',
      classes: classesOf(options.class, 'zx-heading', `zx-heading-${options.level}`),
      level: options.level,
      runs: runsOf(options),
    }),
    button: (options) => ({
      kind: 'button',
      classes: classesOf(options.class, 'zx-button'),
      href: reader.href(options.href) || null,
      label: reader.text(options.label),
    }),
    image: (options) => {
      const src = reader.imageSrc(options.src);
      if (src === null) return { kind: 'raw', html: '', text: '' };
      return {
        kind: 'image',
        classes: classesOf(options.class, 'zx-image'),
        src,
        alt: reader.text(options.alt),
        width: Math.round(options.width),
        href: options.href === undefined ? null : reader.href(options.href),
      };
    },
    divider: (options = {}) => ({ kind: 'divider', classes: classesOf(options.class, 'zx-divider') }),
    list: (options) => ({
      kind: 'list',
      classes: classesOf(options.class, 'zx-text', 'zx-list'),
      ordered: options.ordered ?? false,
      items: options.items.map((item) => reader.runs(item)),
    }),
    code: (options) => ({
      kind: 'code',
      classes: classesOf(options.class, 'zx-code'),
      text: reader.text(options.text),
    }),
    spacer: (options) => ({ kind: 'spacer', classes: classesOf(options.class, 'zx-spacer'), height: options.height }),
    raw: ((
      first: { readonly markup: string } | TemplateStringsArray,
      ...values: readonly (string | number | null | undefined)[]
    ): EmailNode => {
      if ('markup' in first) {
        // The text is read from the filled markup, so an entity that spells `{{` is never filled on either arm.
        const html = reader.markup(first.markup);
        return { kind: 'raw', html, text: `${textOf(html)}\n\n` };
      }
      // Each literal part is filled on its own, so a value never becomes a template.
      const html = first
        .slice(1)
        .reduce(
          (written, part, index) => `${written}${interpolated(written, values[index])}${reader.markup(part)}`,
          reader.markup(first[0]),
        );
      return { kind: 'raw', html, text: `${textOf(html)}\n\n` };
    }) as EmailPrimitives['raw'],
    preheader: (options) => ({ kind: 'preheader', text: reader.text(options.text) }),
    card: (options, children) => ({
      kind: 'card',
      classes: classesOf(options.class, 'zx-card'),
      children: present(children),
    }),
    region: (name, children, options = {}) => ({
      kind: 'region',
      name,
      children: present(children),
      textEnd: options.textEnd ?? 'paragraph',
    }),
  };
}
