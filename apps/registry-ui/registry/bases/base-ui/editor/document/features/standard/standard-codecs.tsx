import { createElement } from 'react';
import type {
  MarkCodec,
  MarkdownToken,
  NodeCodec,
} from '@zeroxsolutions/editor-core/document/core/index';
import type { NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import type { ReactNodeCodec } from '../../../react-types';

/**
 * Codecs for the standard blocks/marks the `standardKit` feature contributes
 * (their engine schema comes from Tiptap's MIT extensions; these give them
 * Markdown/HTML/React serialization + two-way import). Ordered so a task list
 * matches before a plain list and a task item before a plain list item.
 *
 * The node codecs author against the chrome `ReactNodeCodec` (so `toReact` can
 * call `ctx.renderChildren` and return JSX); each is cast back to the core
 * `NodeCodec` at the registry boundary, where the narrowed React signature meets
 * core's opaque `toReact` slot.
 */

const clampLevel = (value: unknown): number =>
  Math.min(6, Math.max(1, Number(value) || 1));
const levelOf = (node: NodeJSON): number => clampLevel(node.attrs?.level);
const blocks = (
  node: NodeJSON,
  join: (parts: string[]) => string,
  serialize: (n: NodeJSON) => string,
) => join((node.content ?? []).map(serialize));

const heading: ReactNodeCodec = {
  node: 'heading',
  toMarkdown: (node, ctx) =>
    `${'#'.repeat(levelOf(node))} ${ctx.serializeChildren(node)}`,
  toHTML: (node, ctx) =>
    `<h${levelOf(node)}>${ctx.serializeChildren(node)}</h${levelOf(node)}>`,
  toReact: (node, ctx) =>
    createElement(`h${levelOf(node)}`, null, ctx.renderChildren(node)),
  fromMarkdown: (token, ctx) =>
    token.type === 'heading'
      ? {
          type: 'heading',
          attrs: { level: clampLevel(token.depth) },
          content: ctx.fromMarkdownChildren(token),
        }
      : null,
  fromHTML: (element, ctx) =>
    /^H[1-6]$/.test(element.tagName)
      ? {
          type: 'heading',
          attrs: { level: Number(element.tagName[1]) },
          content: ctx.fromHTMLChildren(element),
        }
      : null,
};

const blockquote: ReactNodeCodec = {
  node: 'blockquote',
  toMarkdown: (node, ctx) =>
    blocks(node, (p) => p.join('\n\n'), ctx.serializeNode)
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n'),
  toHTML: (node, ctx) =>
    `<blockquote>${blocks(node, (p) => p.join(''), ctx.serializeNode)}</blockquote>`,
  toReact: (node, ctx) => <blockquote>{ctx.renderChildren(node)}</blockquote>,
  fromMarkdown: (token, ctx) =>
    token.type === 'blockquote'
      ? { type: 'blockquote', content: ctx.fromMarkdownChildren(token) }
      : null,
  fromHTML: (element, ctx) =>
    element.tagName === 'BLOCKQUOTE'
      ? { type: 'blockquote', content: ctx.fromHTMLChildren(element) }
      : null,
};

const horizontalRule: NodeCodec = {
  node: 'horizontalRule',
  toMarkdown: () => '---',
  toHTML: () => '<hr>',
  toReact: () => <hr />,
  fromMarkdown: (token) =>
    token.type === 'thematicBreak' ? { type: 'horizontalRule' } : null,
  fromHTML: (element) =>
    element.tagName === 'HR' ? { type: 'horizontalRule' } : null,
};

const hardBreak: NodeCodec = {
  node: 'hardBreak',
  toMarkdown: () => '  \n',
  toHTML: () => '<br>',
  toReact: () => <br />,
  fromMarkdown: (token) =>
    token.type === 'break' ? { type: 'hardBreak' } : null,
  fromHTML: (element) =>
    element.tagName === 'BR' ? { type: 'hardBreak' } : null,
};

const listItem: ReactNodeCodec = {
  node: 'listItem',
  toMarkdown: (node, ctx) =>
    blocks(node, (p) => p.join('\n'), ctx.serializeNode),
  toHTML: (node, ctx) =>
    `<li>${blocks(node, (p) => p.join(''), ctx.serializeNode)}</li>`,
  toReact: (node, ctx) => <li>{ctx.renderChildren(node)}</li>,
  fromMarkdown: (token, ctx) =>
    token.type === 'listItem' && token.checked == null
      ? { type: 'listItem', content: ctx.fromMarkdownChildren(token) }
      : null,
  fromHTML: (element, ctx) =>
    element.tagName === 'LI' &&
    !element.querySelector(':scope > input[type="checkbox"]')
      ? { type: 'listItem', content: ctx.fromHTMLChildren(element) }
      : null,
};

const bulletList: ReactNodeCodec = {
  node: 'bulletList',
  toMarkdown: (node, ctx) =>
    (node.content ?? [])
      .map((item) => `- ${ctx.serializeNode(item)}`)
      .join('\n'),
  toHTML: (node, ctx) =>
    `<ul>${blocks(node, (p) => p.join(''), ctx.serializeNode)}</ul>`,
  toReact: (node, ctx) => <ul>{ctx.renderChildren(node)}</ul>,
  fromMarkdown: (token, ctx) =>
    token.type === 'list' && !token.ordered && !hasTaskItems(token)
      ? { type: 'bulletList', content: ctx.fromMarkdownChildren(token) }
      : null,
  fromHTML: (element, ctx) =>
    element.tagName === 'UL'
      ? { type: 'bulletList', content: ctx.fromHTMLChildren(element) }
      : null,
};

const orderedList: ReactNodeCodec = {
  node: 'orderedList',
  toMarkdown: (node, ctx) =>
    (node.content ?? [])
      .map((item, index) => `${index + 1}. ${ctx.serializeNode(item)}`)
      .join('\n'),
  toHTML: (node, ctx) =>
    `<ol>${blocks(node, (p) => p.join(''), ctx.serializeNode)}</ol>`,
  toReact: (node, ctx) => <ol>{ctx.renderChildren(node)}</ol>,
  fromMarkdown: (token, ctx) =>
    token.type === 'list' && token.ordered
      ? { type: 'orderedList', content: ctx.fromMarkdownChildren(token) }
      : null,
  fromHTML: (element, ctx) =>
    element.tagName === 'OL'
      ? { type: 'orderedList', content: ctx.fromHTMLChildren(element) }
      : null,
};

const taskItem: ReactNodeCodec = {
  node: 'taskItem',
  toMarkdown: (node, ctx) =>
    `- [${node.attrs?.checked ? 'x' : ' '}] ${blocks(node, (p) => p.join('\n'), ctx.serializeNode)}`,
  toHTML: (node, ctx) =>
    `<li data-checked="${Boolean(node.attrs?.checked)}">${blocks(node, (p) => p.join(''), ctx.serializeNode)}</li>`,
  toReact: (node, ctx) => (
    <li data-checked={Boolean(node.attrs?.checked)}>
      {ctx.renderChildren(node)}
    </li>
  ),
  fromMarkdown: (token, ctx) =>
    token.type === 'listItem' && token.checked != null
      ? {
          type: 'taskItem',
          attrs: { checked: Boolean(token.checked) },
          content: ctx.fromMarkdownChildren(token),
        }
      : null,
};

const taskList: ReactNodeCodec = {
  node: 'taskList',
  toMarkdown: (node, ctx) =>
    (node.content ?? []).map((item) => ctx.serializeNode(item)).join('\n'),
  toHTML: (node, ctx) =>
    `<ul data-type="taskList">${blocks(node, (p) => p.join(''), ctx.serializeNode)}</ul>`,
  toReact: (node, ctx) => (
    <ul data-type="taskList">{ctx.renderChildren(node)}</ul>
  ),
  fromMarkdown: (token, ctx) =>
    token.type === 'list' && !token.ordered && hasTaskItems(token)
      ? { type: 'taskList', content: ctx.fromMarkdownChildren(token) }
      : null,
  fromHTML: (element, ctx) =>
    element.tagName === 'UL' && element.getAttribute('data-type') === 'taskList'
      ? { type: 'taskList', content: ctx.fromHTMLChildren(element) }
      : null,
};

function hasTaskItems(token: MarkdownToken): boolean {
  return (token.children ?? []).some(
    (child) => (child as { checked?: unknown }).checked != null,
  );
}

export const standardNodeCodecs = [
  heading,
  blockquote,
  horizontalRule,
  hardBreak,
  // task list before bullet list; task item before list item (match order)
  taskList,
  taskItem,
  bulletList,
  orderedList,
  listItem,
] as NodeCodec[];

// ── Mark codecs ──────────────────────────────────────────────────────────────

const wrap = (Tag: string) => (_mark: unknown, children: unknown) =>
  createElement(Tag, null, children as never);

const bold: MarkCodec = {
  mark: 'bold',
  toMarkdown: () => ({ open: '**', close: '**' }),
  toHTML: () => ({ open: '<strong>', close: '</strong>' }),
  toReact: wrap('strong'),
  fromMarkdown: (token) => (token.type === 'strong' ? { type: 'bold' } : null),
  fromHTML: (element) =>
    /^(STRONG|B)$/.test(element.tagName) ? { type: 'bold' } : null,
};

const italic: MarkCodec = {
  mark: 'italic',
  toMarkdown: () => ({ open: '_', close: '_' }),
  toHTML: () => ({ open: '<em>', close: '</em>' }),
  toReact: wrap('em'),
  fromMarkdown: (token) =>
    token.type === 'emphasis' ? { type: 'italic' } : null,
  fromHTML: (element) =>
    /^(EM|I)$/.test(element.tagName) ? { type: 'italic' } : null,
};

const strike: MarkCodec = {
  mark: 'strike',
  toMarkdown: () => ({ open: '~~', close: '~~' }),
  toHTML: () => ({ open: '<s>', close: '</s>' }),
  toReact: wrap('s'),
  fromMarkdown: (token) =>
    token.type === 'delete' ? { type: 'strike' } : null,
  fromHTML: (element) =>
    /^(S|DEL|STRIKE)$/.test(element.tagName) ? { type: 'strike' } : null,
};

const code: MarkCodec = {
  mark: 'code',
  toMarkdown: () => ({ open: '`', close: '`' }),
  toHTML: () => ({ open: '<code>', close: '</code>' }),
  toReact: wrap('code'),
  fromMarkdown: (token) =>
    token.type === 'inlineCode' ? { type: 'code' } : null,
  fromHTML: (element) => (element.tagName === 'CODE' ? { type: 'code' } : null),
};

const underline: MarkCodec = {
  mark: 'underline',
  toMarkdown: () => ({ open: '<u>', close: '</u>' }),
  toHTML: () => ({ open: '<u>', close: '</u>' }),
  toReact: wrap('u'),
  fromHTML: (element) =>
    element.tagName === 'U' ? { type: 'underline' } : null,
};

const highlight: MarkCodec = {
  mark: 'highlight',
  toMarkdown: () => ({ open: '==', close: '==' }),
  toHTML: () => ({ open: '<mark>', close: '</mark>' }),
  toReact: wrap('mark'),
  fromHTML: (element) =>
    element.tagName === 'MARK' ? { type: 'highlight' } : null,
};

const subscript: MarkCodec = {
  mark: 'subscript',
  toMarkdown: () => ({ open: '~', close: '~' }),
  toHTML: () => ({ open: '<sub>', close: '</sub>' }),
  toReact: wrap('sub'),
  fromHTML: (element) =>
    element.tagName === 'SUB' ? { type: 'subscript' } : null,
};

const superscript: MarkCodec = {
  mark: 'superscript',
  toMarkdown: () => ({ open: '^', close: '^' }),
  toHTML: () => ({ open: '<sup>', close: '</sup>' }),
  toReact: wrap('sup'),
  fromHTML: (element) =>
    element.tagName === 'SUP' ? { type: 'superscript' } : null,
};

export const standardMarkCodecs: MarkCodec[] = [
  bold,
  italic,
  strike,
  code,
  underline,
  highlight,
  subscript,
  superscript,
];
