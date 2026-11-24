import { z } from 'zod';
import type {
  DeserializeContext,
  MarkdownToken,
  NodeCodec,
  NodeJSON,
  SerializeContext,
} from '../document/core/types/index.js';
import { BlockDefinitionInvalid, type BlockEditor } from '../template/email/define-email-block.js';
import { plainInlineText } from '../template/markup/inline-markup.js';
import { markupOfNodes, nodesOfMarkup } from './inline-markup-nodes.js';

/** HTML a definition's `markup` template built, or the body the codec serialised: written as it is. */
export class MarkupValue {
  constructor(
    readonly html: string,
    /** Whether it holds a value, which was checked for where the fragment put it and nowhere else. */
    readonly holdsValues: boolean,
  ) {}
}

/** An address `markup.url` let through: the only value a link or a source attribute takes. */
class UrlValue extends MarkupValue {}

/**
 * Builds a block's HTML. Every value is escaped and drawn as text; a `MarkupValue` is written as it is, and a
 * list of them one after another. A value goes in text or in a quoted `class`, `id`, `title`, `alt`, `lang`,
 * `dir`, `role`, `width`, `height`, `colspan`, `rowspan`, `headers`, `scope`, `target`, `rel`, `download`,
 * `datetime`, `name`, `data-*` or `aria-*` value. A link goes through `markup.url`, which takes a web or mail
 * address and turns any other into an empty one, and only in `href` of `a`, `src` of `img`, `video`, `audio` and
 * `source`, and `poster` of `video`.
 *
 * @throws {BlockDefinitionInvalid} for a value anywhere else: naming a tag, loose inside one, in another
 * attribute, or after a comment, a declaration or an element that runs, styles, frames or loads, such as
 * `script`, `style`, `textarea`, `svg` or `link`; for a fragment holding a value anywhere but in text; and for a
 * value that is not text, a number, a boolean, null, undefined or a list of fragments
 */
export interface Markup {
  (strings: TemplateStringsArray, ...values: readonly unknown[]): MarkupValue;
  url(value: string): MarkupValue;
}

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '\n': '&#10;',
  '\r': '&#13;',
};

/** `value` safe in text and in a quoted attribute; a newline is a character reference, so it opens no blank line. */
function escaped(value: string): string {
  return value.replace(/[&<>"'\n\r]/g, (character) => ESCAPES[character]);
}

function unescaped(value: string): string {
  return value.replace(
    /&(amp|lt|gt|quot|#39|#10|#13);/g,
    (entity) => Object.entries(ESCAPES).find(([, written]) => written === entity)?.[0] ?? entity,
  );
}

const ADDRESS = /^(?:https?:|mailto:)/i;
/**
 * Elements whose content a browser reads as code, style or a document, or which load or redirect what the page
 * loads; with a comment or a declaration, a template that has opened one takes no value after it.
 */
const CLOSED_ELEMENTS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'textarea',
  'title',
  'iframe',
  'noscript',
  'xmp',
  'noembed',
  'noframes',
  'plaintext',
  'template',
  'svg',
  'math',
  'base',
  'link',
  'meta',
  'object',
  'embed',
  'param',
  'applet',
  'frame',
  'frameset',
]);
/** Attributes an escaped value stays inert in. */
const TEXT_ATTRIBUTE =
  /^(?:class|id|title|alt|lang|dir|role|width|height|colspan|rowspan|headers|scope|target|rel|download|datetime|name|data-[a-z0-9-]+|aria-[a-z-]+)$/;
/** The link and source attributes a `markup.url` value may go in, by element. */
const LINK_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ['href'],
  img: ['src'],
  video: ['src', 'poster'],
  audio: ['src'],
  source: ['src'],
};
/** What HTML counts as space, narrower than a regular expression's `\s`. */
const SPACE = /[\t\n\f\r ]/;

/** Where the next character of some HTML lands, as a browser's tokenizer reads it. */
type Place =
  | { readonly kind: 'text' }
  /** Right after `<` or `</`, where a value would name a tag. */
  | { readonly kind: 'opening' }
  /** After a comment, a declaration or a closed element, where no value goes. */
  | { readonly kind: 'closed'; readonly reason: string }
  | { readonly kind: 'tag'; readonly tag: string }
  | { readonly kind: 'unquoted'; readonly tag: string }
  | { readonly kind: 'value'; readonly tag: string; readonly attribute: string; readonly quote: string };

/** Where a character appended to `html` lands. Escaped values hold no `<`, `>` or quote, so they never move it. */
function placeAfter(html: string): Place {
  let place: Place = { kind: 'text' };
  let at = 0;
  while (at < html.length) {
    const character = html[at];
    if (place.kind === 'text') {
      if (character !== '<') {
        at += 1;
        continue;
      }
      const rest = html.slice(at + 1);
      if (rest === '' || rest === '/') return { kind: 'opening' };
      if (rest.startsWith('!') || rest.startsWith('?')) {
        return { kind: 'closed', reason: 'no value goes after a comment or a declaration' };
      }
      const opened = /^\/?([a-zA-Z][^\t\n\f\r />]*)/.exec(rest);
      if (opened === null) {
        at += 1;
        continue;
      }
      const tag = opened[1].toLowerCase();
      if (CLOSED_ELEMENTS.has(tag)) return { kind: 'closed', reason: `no value goes after a ${tag} element` };
      place = { kind: 'tag', tag };
      at += 1 + opened[0].length;
    } else if (place.kind === 'value') {
      if (character === place.quote) place = { kind: 'tag', tag: place.tag };
      at += 1;
    } else if (place.kind === 'unquoted') {
      if (character === '>') place = { kind: 'text' };
      else if (SPACE.test(character)) place = { kind: 'tag', tag: place.tag };
      at += 1;
    } else if (place.kind === 'tag') {
      const tag: string = place.tag;
      if (character === '>' || character === '/' || SPACE.test(character)) {
        if (character === '>') place = { kind: 'text' };
        at += 1;
        continue;
      }
      const attribute = /^([^\t\n\f\r "'<>/=]+)[\t\n\f\r ]*(?:=[\t\n\f\r ]*(["']?))?/.exec(html.slice(at));
      if (attribute === null) return { kind: 'closed', reason: `the template's <${tag}> tag cannot be read` };
      at += attribute[0].length;
      if (attribute[2] === '') place = { kind: 'unquoted', tag };
      else if (attribute[2] !== undefined) {
        place = { kind: 'value', tag, attribute: attribute[1].toLowerCase(), quote: attribute[2] };
      }
    } else return place;
  }
  return place;
}

/** Why `value` cannot be placed where `place` is, or null where it can. */
function placementRefusal(place: Place, value: unknown): string | null {
  const url = value instanceof UrlValue;
  const fragment = value instanceof MarkupValue && !url;
  // A fragment of the definition's own markup alone holds no value, so it may go wherever the definition puts it.
  if (fragment && !value.holdsValues) return null;
  switch (place.kind) {
    case 'text':
      return null;
    case 'opening':
      return 'a value cannot name a tag';
    case 'closed':
      return place.reason;
    case 'tag':
    case 'unquoted':
      return 'a value inside a tag goes in a quoted attribute value';
    case 'value':
      if (fragment) return 'a fragment holding a value goes in text, where its values were checked';
      if (LINK_ATTRIBUTES[place.tag]?.includes(place.attribute)) {
        return url ? null : `a value in ${place.attribute} goes through markup.url`;
      }
      return TEXT_ATTRIBUTE.test(place.attribute) ? null : `a value cannot go in ${place.attribute} of <${place.tag}>`;
  }
}

/** The `markup` template of block `type`, recording whether `body` was placed. */
function markupOf(type: string, body: MarkupValue, placed: { body: boolean }): Markup {
  const template = (strings: TemplateStringsArray, ...values: readonly unknown[]): MarkupValue => {
    let html = strings[0];
    let holdsValues = false;
    const place = (value: unknown): void => {
      const refusal = placementRefusal(placeAfter(html), value);
      if (refusal !== null) throw new BlockDefinitionInvalid(type, refusal);
      if (value === body) placed.body = true;
      if (value instanceof MarkupValue) {
        html += value.html;
        holdsValues ||= value.holdsValues;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        html += escaped(String(value));
        holdsValues = true;
      } else if (value !== null && value !== undefined) {
        throw new BlockDefinitionInvalid(type, 'a value is text, a number, a boolean, null, undefined or fragments');
      }
    };
    values.forEach((value, index) => {
      if (Array.isArray(value)) {
        for (const part of value) {
          if (!(part instanceof MarkupValue)) throw new BlockDefinitionInvalid(type, 'a list holds fragments only');
          place(part);
        }
      } else place(value);
      html += strings[index + 1];
    });
    return new MarkupValue(html, holdsValues);
  };
  return Object.assign(template, {
    url: (value: string): MarkupValue => new UrlValue(ADDRESS.test(value.trim()) ? escaped(value.trim()) : '', true),
  });
}

/** What a definition's `html` reads: its fields and items as stored, its attributes with defaults, and its body. */
export interface DocumentBlockView<Fields, Attributes> {
  readonly fields: Fields;
  readonly attributes: Attributes;
  /** The body's HTML, to place where the block shows it; placed after the rest when the definition leaves it out. */
  readonly body: MarkupValue;
}

export type DocumentBlockHtml<Fields, Attributes> = (
  view: DocumentBlockView<Fields, Attributes>,
  markup: Markup,
) => MarkupValue;

/** The attribute schemas of a block's document node: each field, items field and attribute, none required. */
export function documentAttributes(editor: BlockEditor): z.ZodObject<Record<string, z.ZodType>> {
  return z.object({
    ...Object.fromEntries(editor.fields.map(({ name }) => [name, z.string().optional()])),
    ...Object.fromEntries(
      editor.items.map(({ name, fields }) => [
        name,
        z
          .array(z.object(Object.fromEntries(fields.map((field) => [field.name, z.string().optional()]))).strict())
          .optional(),
      ]),
    ),
    ...Object.fromEntries(
      editor.attributes.map((attribute) => {
        const schema =
          attribute.kind === 'choice'
            ? z.enum(attribute.values.map(({ value }) => value) as [string, ...string[]])
            : attribute.kind === 'toggle'
              ? z.boolean()
              : z.number().min(attribute.min).max(attribute.max);
        return [attribute.name, schema.optional()];
      }),
    ),
  });
}

/**
 * The HTML and Markdown codec of a block's document node. HTML is `<div data-block="<type>">` carrying the node's
 * attributes as JSON in `data-block-attrs`, around the definition's own HTML, the body in `<div data-block-body>`.
 * Markdown is the same element on one line, the JSON also holding the body as inline markup, so it reads back
 * as one HTML block. A stored attribute the node does not take is dropped on import.
 */
export function documentCodecOf(editor: BlockEditor, html: DocumentBlockHtml<never, never>): NodeCodec {
  const schema = documentAttributes(editor);
  const shape = schema.shape;
  const opening = `<div data-block="${editor.type}" data-block-attrs="`;

  /** What the node stores, its blanks left out. */
  const storedOf = (node: NodeJSON): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(node.attrs ?? {}).filter(
        ([name, value]) => Object.hasOwn(shape, name) && value !== null && value !== undefined,
      ),
    );

  /** Each stored attribute the node takes; one it does not, or that `raw` cannot be read as, is left out. */
  const readAttributes = (raw: unknown): Record<string, unknown> => {
    if (typeof raw !== 'object' || raw === null) return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).flatMap(([name, value]) => {
        if (!Object.hasOwn(shape, name)) return [];
        const parsed = shape[name].safeParse(value);
        return parsed.success && parsed.data !== undefined ? [[name, parsed.data]] : [];
      }),
    );
  };

  const viewOf = (
    node: NodeJSON,
    body: MarkupValue,
  ): DocumentBlockView<Record<string, unknown>, Record<string, unknown>> => {
    const attrs = node.attrs ?? {};
    const text = (name: string): string => (typeof attrs[name] === 'string' ? (attrs[name] as string) : '');
    return {
      fields: {
        ...Object.fromEntries(editor.fields.map(({ name }) => [name, text(name)])),
        ...Object.fromEntries(
          editor.items.map(({ name, fields }) => [
            name,
            (Array.isArray(attrs[name]) ? (attrs[name] as unknown[]) : []).map((entry) =>
              Object.fromEntries(
                fields.map((field) => {
                  const value =
                    typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>)[field.name] : '';
                  return [field.name, typeof value === 'string' ? value : ''];
                }),
              ),
            ),
          ]),
        ),
        ...(editor.body === null ? {} : { [editor.body.name]: markupOfNodes(node.content ?? []) }),
      },
      attributes: Object.fromEntries(
        editor.attributes.map((attribute) => {
          const parsed = shape[attribute.name].safeParse(attrs[attribute.name]);
          return [attribute.name, parsed.success && parsed.data !== undefined ? parsed.data : attribute.default];
        }),
      ),
      body,
    };
  };

  /** The element for `node`: its attributes' JSON, then the definition's HTML with `body` placed in it. */
  const element = (node: NodeJSON, json: Record<string, unknown>, bodyHtml: string): string => {
    const body = new MarkupValue(editor.body === null ? '' : `<div data-block-body>${bodyHtml}</div>`, true);
    const placed = { body: false };
    const inner = (html as DocumentBlockHtml<Record<string, unknown>, Record<string, unknown>>)(
      viewOf(node, body),
      markupOf(editor.type, body, placed),
    ).html;
    return `${opening}${escaped(JSON.stringify(json))}">${inner}${placed.body ? '' : body.html}</div>`;
  };

  const nodeOf = (attrs: Record<string, unknown>, content: NodeJSON[]): NodeJSON => ({
    type: editor.node,
    attrs,
    ...(content.length === 0 ? {} : { content }),
  });

  return {
    node: editor.node,
    toHTML: (node: NodeJSON, ctx: SerializeContext) =>
      element(node, storedOf(node), editor.body === null ? '' : ctx.serializeChildren(node)),
    toMarkdown: (node: NodeJSON) => {
      const markup = editor.body === null ? '' : markupOfNodes(node.content ?? []);
      const json = { ...storedOf(node), ...(editor.body === null ? {} : { [editor.body.name]: markup }) };
      // A blank line would end the HTML block; values are escaped, so only the definition's own lines could.
      return element(node, json, escaped(plainInlineText(markup)))
        .replace(/\r\n?/g, '\n')
        .replace(/\n[\t ]*(?=\n)/g, '');
    },
    fromHTML: (target: HTMLElement, ctx: DeserializeContext) => {
      if (target.getAttribute('data-block') !== editor.type) return null;
      const attrs = readAttributes(parseJson(target.getAttribute('data-block-attrs') ?? ''));
      const body = [...target.querySelectorAll<HTMLElement>('[data-block-body]')].find(
        (candidate) => candidate.closest('[data-block]') === target,
      );
      return nodeOf(attrs, editor.body !== null && body ? ctx.fromHTMLChildren(body) : []);
    },
    fromMarkdown: (token: MarkdownToken) => {
      const value = typeof token.value === 'string' ? token.value : '';
      if (token.type !== 'html' || !value.startsWith(opening)) return null;
      const json = parseJson(unescaped(value.slice(opening.length, value.indexOf('"', opening.length))));
      const stored = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
      const markup = editor.body === null ? undefined : stored[editor.body.name];
      return nodeOf(readAttributes(stored), typeof markup === 'string' ? nodesOfMarkup(markup) : []);
    },
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
