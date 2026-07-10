import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import type { CodecRegistry } from './codec-registry.js';
import { validateDoc, type ImportReport } from './validate-doc.js';
import type { DeserializeContext, MarkdownToken } from '../core/types/codec.js';
import type { DocJSON, MarkJSON, NodeJSON } from '../core/types/json.js';
import type { ImportResult } from '../core/types/import-result.js';

/**
 * Two-way Markdown import via the **token path** (task 4.4): parse to an mdast
 * token tree (`remark` + `remark-gfm`), then let each feature's `fromMarkdown`
 * codec reconstruct its node from a token — so custom blocks with non-standard
 * Markdown survive rather than being flattened. Produced nodes are Zod-gated and
 * the result reports warnings + dropped content (see the `editor-serialization`
 * spec). Engine-free.
 */
const INLINE_TYPES = new Set([
  'text',
  'emphasis',
  'strong',
  'delete',
  'inlineCode',
  'link',
  'break',
  'image',
]);

export function importMarkdown(
  markdown: string,
  registry: CodecRegistry,
): ImportResult {
  const report: ImportReport = { warnings: [], dropped: [] };
  const tree = remark().use(remarkGfm).parse(markdown) as unknown as MarkdownToken;

  const ctx: DeserializeContext = {
    warn: (message, source) => report.warnings.push({ message, source }),
    fromMarkdownChildren: (token) => convertChildren(token),
    fromHTMLChildren: () => [],
  };

  const matchMark = (token: MarkdownToken): MarkJSON | null => {
    for (const codec of registry.allMarkCodecs()) {
      const mark = codec.fromMarkdown?.(token, ctx);
      if (mark) return mark;
    }
    return null;
  };

  const convertInline = (
    token: MarkdownToken,
    marks: MarkJSON[],
  ): NodeJSON[] => {
    if (token.type === 'text') return [textNode(token.value ?? '', marks)];
    if (token.type === 'inlineCode') {
      const mark = matchMark(token);
      return [textNode(token.value ?? '', mark ? [...marks, mark] : marks)];
    }
    if (token.type === 'break') return [textNode('\n', marks)];
    if (token.type === 'image') {
      report.warnings.push({
        message: 'Inline image has no codec; dropped.',
        source: 'image',
      });
      report.dropped.push({ source: 'image', reason: 'no-markdown-codec' });
      return [];
    }
    const mark = matchMark(token);
    if (!mark) {
      report.warnings.push({
        message: `No Markdown mark codec for "${token.type}".`,
        source: token.type,
      });
    }
    const nextMarks = mark ? [...marks, mark] : marks;
    return (token.children ?? []).flatMap((child) =>
      convertInline(child, nextMarks),
    );
  };

  const convertBlock = (token: MarkdownToken): NodeJSON | null => {
    for (const codec of registry.allNodeCodecs()) {
      const node = codec.fromMarkdown?.(token, ctx);
      if (node) return node;
    }
    report.warnings.push({
      message: `No Markdown codec for token "${token.type}".`,
      source: token.type,
    });
    report.dropped.push({ source: token.type, reason: 'no-markdown-codec' });
    return null;
  };

  function convertChildren(token: MarkdownToken): NodeJSON[] {
    const out: NodeJSON[] = [];
    for (const child of token.children ?? []) {
      if (INLINE_TYPES.has(child.type)) {
        out.push(...convertInline(child, []));
      } else {
        const block = convertBlock(child);
        if (block) out.push(block);
      }
    }
    return out;
  }

  const rawDoc = (convertBlock(tree) as DocJSON | null) ?? {
    type: 'doc',
    content: [],
  };
  const doc = validateDoc(rawDoc, registry, report);
  return { doc, warnings: report.warnings, dropped: report.dropped };
}

function textNode(text: string, marks: MarkJSON[]): NodeJSON {
  return marks.length ? { type: 'text', text, marks } : { type: 'text', text };
}
