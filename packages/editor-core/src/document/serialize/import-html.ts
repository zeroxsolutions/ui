import type { CodecRegistry } from './codec-registry.js';
import { validateDoc, type ImportReport } from './validate-doc.js';
import type { DeserializeContext } from '../core/types/codec.js';
import type { DocJSON, MarkJSON, NodeJSON } from '../core/types/json.js';
import type { ImportResult } from '../core/types/import-result.js';

/**
 * HTML import (task 4.5): parse the HTML and walk the DOM, delegating each
 * element to its feature's `fromHTML` codec — mark codecs wrap inline text,
 * node codecs reconstruct blocks — with a children-unwrap fallback for unknown
 * elements. Produced nodes are Zod-gated; the result reports warnings + dropped.
 *
 * Requires a DOM (`DOMParser`) — available in the browser and under jsdom; a
 * Node-side migration must provide a DOM shim.
 */
export function importHTML(
  html: string,
  registry: CodecRegistry,
): ImportResult {
  const report: ImportReport = { warnings: [], dropped: [] };
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  const ctx: DeserializeContext = {
    warn: (message, source) => report.warnings.push({ message, source }),
    fromMarkdownChildren: () => [],
    fromHTMLChildren: (element) => convertChildren(element),
  };

  const matchMark = (element: HTMLElement): MarkJSON | null => {
    for (const codec of registry.allMarkCodecs()) {
      const mark = codec.fromHTML?.(element, ctx);
      if (mark) return mark;
    }
    return null;
  };

  const addMark = (nodes: NodeJSON[], mark: MarkJSON): NodeJSON[] =>
    nodes.map((node) =>
      node.type === 'text'
        ? { ...node, marks: [...(node.marks ?? []), mark] }
        : node,
    );

  function convertElement(element: HTMLElement): NodeJSON[] {
    const mark = matchMark(element);
    if (mark) return addMark(convertChildren(element), mark);

    for (const codec of registry.allNodeCodecs()) {
      const node = codec.fromHTML?.(element, ctx);
      if (node) return [node];
    }

    report.warnings.push({
      message: `No HTML codec for <${element.tagName.toLowerCase()}>; unwrapped.`,
      source: element.tagName.toLowerCase(),
    });
    return convertChildren(element);
  }

  function convertChildren(element: HTMLElement): NodeJSON[] {
    const out: NodeJSON[] = [];
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 3) {
        const text = child.textContent ?? '';
        if (text.trim().length > 0) out.push({ type: 'text', text });
      } else if (child.nodeType === 1) {
        out.push(...convertElement(child as HTMLElement));
      }
    }
    return out;
  }

  const rawDoc: DocJSON = {
    type: 'doc',
    content: convertChildren(parsed.body),
  };
  const doc = validateDoc(rawDoc, registry, report);
  return { doc, warnings: report.warnings, dropped: report.dropped };
}
