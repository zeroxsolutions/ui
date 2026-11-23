import {
  CONTENT_LOAD_META,
  Plugin,
  PluginKey,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';

/**
 * Takes off every mark outside `allowed` as soon as a change puts one on, so a shortcut or a paste of a mark the
 * stored text cannot hold leaves the text plain. A host's load passes.
 */
export function heldMarks(allowed: ReadonlySet<string>): Plugin {
  return new Plugin({
    key: new PluginKey('heldMarks'),
    appendTransaction(transactions, _before, state) {
      if (transactions.some((tr) => tr.getMeta(CONTENT_LOAD_META))) return null;
      if (!transactions.some((tr) => tr.docChanged || tr.storedMarksSet)) return null;
      const tr = state.tr;
      const stray = new Set<ProseMirrorNode['marks'][number]['type']>();
      state.doc.descendants((node) => {
        for (const mark of node.marks) if (!allowed.has(mark.type.name)) stray.add(mark.type);
        return true;
      });
      for (const type of stray) tr.removeMark(0, state.doc.content.size, type);
      const stored = state.storedMarks;
      if (stored?.some((mark) => !allowed.has(mark.type.name))) {
        tr.setStoredMarks(stored.filter((mark) => allowed.has(mark.type.name)));
      }
      return tr.docChanged || tr.storedMarksSet ? tr : null;
    },
  });
}
