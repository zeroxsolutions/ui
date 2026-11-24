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
  constructor(readonly html: string) {}
}

/** An address `markup.url` let through: the only value a link or a source attribute takes. */
class UrlValue extends MarkupValue {}

/**
 * Builds a block's HTML. Every value is escaped and drawn as text; a `MarkupValue` is written as it is. A link
 * goes through `markup.url`, which takes a web or mail address and turns any other into an empty one.
 *
 * @throws {BlockDefinitionInvalid} for a value the escape cannot keep inert: in an event handler or a style, in
 * a link or source attribute other than `markup.url`'s, unquoted, inside a tag outside a value, or in a script
 * or a style element; and for a value that is not text, a number, a boolean, null or undefined
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
/** Attributes whose value a browser loads or follows. */
const LINK_ATTRIBUTE = /^(?:href|src|srcset|poster|action|formaction|xlink:href|data|background|cite|ping)$/i;
/** Attributes whose value a browser runs or applies as style. */
const ACTIVE_ATTRIBUTE = /^(?:on\w+|style)$/i;

/** Why a value placed after `before` would not stay text, or null where it would. */
function placementRefusal(before: string, value: unknown): string | null {
  const lower = before.toLowerCase();
  for (const element of ['script', 'style']) {
    if (lower.lastIndexOf(`<${element}`) > lower.lastIndexOf(`</${element}`)) {
      return `a value cannot go inside a ${element} element`;
    }
  }
  const open = before.lastIndexOf('<');
  const tag = before.slice(open);
  if (open === -1 || open < before.lastIndexOf('>') || tag.startsWith('<!--')) return null;
  const quoted = /([^\s"'=<>/]+)\s*=\s*(["'])[^"']*$/.exec(tag);
  if (quoted === null) return 'a value inside a tag goes in a quoted attribute value';
  if (ACTIVE_ATTRIBUTE.test(quoted[1])) return `a value cannot go in ${quoted[1]}`;
  if (LINK_ATTRIBUTE.test(quoted[1]) && !(value instanceof UrlValue)) {
    return `a value in ${quoted[1]} goes through markup.url`;
  }
  return null;
}

/** The `markup` template of block `type`, recording whether `body` was placed. */
function markupOf(type: string, body: MarkupValue, placed: { body: boolean }): Markup {
  const template = (strings: TemplateStringsArray, ...values: readonly unknown[]): MarkupValue => {
    let html = strings[0];
    let literal = strings[0];
    values.forEach((value, index) => {
      const refusal = placementRefusal(literal, value);
      if (refusal !== null) throw new BlockDefinitionInvalid(type, refusal);
      if (value === body) placed.body = true;
      if (value instanceof MarkupValue) html += value.html;
      else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        html += escaped(String(value));
      } else if (value !== null && value !== undefined) {
        throw new BlockDefinitionInvalid(type, 'a value is text, a number, a boolean, null or undefined');
      }
      // Values are text, so only the literal parts decide where the next value lands.
      literal += `x${strings[index + 1]}`;
      html += strings[index + 1];
    });
    return new MarkupValue(html);
  };
  return Object.assign(template, {
    url: (value: string): MarkupValue => new UrlValue(ADDRESS.test(value.trim()) ? escaped(value.trim()) : ''),
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
        z.array(z.object(Object.fromEntries(fields.map((field) => [field.name, z.string()]))).strict()).optional(),
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
    const body = new MarkupValue(editor.body === null ? '' : `<div data-block-body>${bodyHtml}</div>`);
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
      return element(node, json, escaped(plainInlineText(markup))).replace(/\n[\t ]*(?=\n)/g, '');
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
