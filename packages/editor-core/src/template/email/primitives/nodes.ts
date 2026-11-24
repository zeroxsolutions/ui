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
/** A value that opens a tag; one that does not, such as a lone quote, is left alone in the layout's own markup. */
const OPENS_TAG = /</;

/**
 * The layout's reader: it prints the product's own props as given, checks each link's and image's scheme as a
 * block's are checked, and escapes `personal`, the filled subject and preheader, wherever raw markup holds one
 * that opens a tag.
 */
export function layoutReader(personal: readonly string[]): PrimitiveReader {
  const escaped = personal.filter((value) => OPENS_TAG.test(value));
  return {
    ...literalReader,
    href: (template) => (LAYOUT_LINK.test(template.trim()) ? template.trim() : null),
    imageSrc: (template) => (LAYOUT_IMAGE.test(template.trim()) ? template.trim() : null),
    markup: (template) => escaped.reduce((markup, value) => markup.split(value).join(escapeHtml(value)), template),
  };
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
   * Markup as written, every value escaped; never styled. Its text arm is the markup with its tags dropped. A
   * layout's `raw` writes its markup as given: a person's value, as the subject and preheader hold, goes through
   * `text`, though a filled subject or preheader found in it is escaped.
   */
  raw(options: { readonly markup: string }): EmailNode;
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
    raw: (options) => ({
      kind: 'raw',
      html: reader.markup(options.markup),
      text: `${reader.text(withoutTags(options.markup))}\n\n`,
    }),
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
