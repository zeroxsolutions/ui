import type { DocJSON, NodeJSON } from '../core/types/index.js';

/**
 * `doc` with every section below its top replaced by the blocks it holds, in its place, at any depth. A section
 * sits only at the top of a document, but HTML from another page or a host's JSON may hold one in a lane, a
 * section, a callout or a cell; reading its blocks in place keeps every word. A document holding no section below
 * its top comes back as the same object.
 */
export function withSectionsAtTop(doc: DocJSON): DocJSON {
  const content = doc.content?.map(withSectionsUnwrapped);
  return content === undefined || content.every((node, index) => node === doc.content?.[index])
    ? doc
    : { ...doc, content };
}

/** `node` with every section inside it replaced by its blocks; `node` itself stays what it is. */
function withSectionsUnwrapped(node: NodeJSON): NodeJSON {
  if (node.content === undefined) return node;
  let changed = false;
  const content = node.content.flatMap((child) => {
    const held = withSectionsUnwrapped(child);
    if (held !== child) changed = true;
    if (held.type !== 'section') return [held];
    changed = true;
    return held.content ?? [];
  });
  return changed ? { ...node, content } : node;
}
