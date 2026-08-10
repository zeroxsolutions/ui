import type { CodecRegistry } from './codec-registry.js';
import type { DocJSON, MarkJSON, NodeJSON } from '../core/types/json.js';
import type {
  DroppedNode,
  ImportWarning,
} from '../core/types/import-result.js';

/**
 * The import trust boundary (task 4.6). Every produced node/mark is validated
 * against its registered Zod attribute schema before it enters the document: a
 * node with invalid attributes is dropped (with a warning + a `dropped` entry),
 * a mark with invalid attributes is stripped but its text kept. The result
 * contains only validated nodes — import never silently corrupts the document.
 */
export interface ImportReport {
  warnings: ImportWarning[];
  dropped: DroppedNode[];
}

export function validateDoc(
  doc: DocJSON,
  registry: CodecRegistry,
  report: ImportReport,
): DocJSON {
  return (
    (validateNode(doc, registry, report) as DocJSON) ?? {
      type: 'doc',
      content: [],
    }
  );
}

function validateNode(
  node: NodeJSON,
  registry: CodecRegistry,
  report: ImportReport,
): NodeJSON | null {
  const result: NodeJSON = { type: node.type };

  const schema = registry.nodeSchema(node.type);
  if (schema) {
    const parsed = schema.safeParse(node.attrs ?? {});
    if (!parsed.success) {
      report.warnings.push({
        message: `Invalid attributes for node "${node.type}" — node dropped.`,
        source: node.type,
      });
      report.dropped.push({ source: node.type, reason: 'invalid-attributes' });
      return null;
    }
    result.attrs = parsed.data as Record<string, unknown>;
  } else if (node.attrs) {
    result.attrs = node.attrs;
  }

  if (node.text !== undefined) result.text = node.text;

  if (node.content) {
    result.content = node.content
      .map((child) => validateNode(child, registry, report))
      .filter((child): child is NodeJSON => child !== null);
  }

  if (node.marks) {
    result.marks = node.marks
      .map((mark) => validateMark(mark, registry, report))
      .filter((mark): mark is MarkJSON => mark !== null);
  }

  return result;
}

function validateMark(
  mark: MarkJSON,
  registry: CodecRegistry,
  report: ImportReport,
): MarkJSON | null {
  const schema = registry.markSchema(mark.type);
  if (!schema) return mark;
  const parsed = schema.safeParse(mark.attrs ?? {});
  if (parsed.success) {
    return { type: mark.type, attrs: parsed.data as Record<string, unknown> };
  }
  report.warnings.push({
    message: `Invalid attributes for mark "${mark.type}" — mark dropped.`,
    source: mark.type,
  });
  return null;
}
