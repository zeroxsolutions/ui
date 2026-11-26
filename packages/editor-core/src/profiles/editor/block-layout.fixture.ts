import { history, undo } from '@tiptap/pm/history';
import { z } from 'zod';
import type { Editor } from '../../document/advanced.js';
import { createDocumentEditor } from '../../document/core/create-document-editor.js';
import type { DocJSON, EditorFeature, IEditor, NodeJSON, NodeSpec } from '../../document/core/types/index.js';
import { LAYOUT_NODES } from '../../template/layout/index.js';
import { buttonNodeSpec, columnsNodeSpecs, sectionNodeSpecs } from '../core/email-nodes.js';
import { blockLayout } from './block-layout.js';

/** Stand-ins for the Document Editor's own blocks, which live outside editor-core: each its name, its HTML by `data-type`. */
const OWN_SPEC_NODES = new Set(['paragraph', 'columns', 'section', 'button', 'table']);
const standIns: NodeSpec[] = Object.keys(LAYOUT_NODES)
  .filter((type) => !OWN_SPEC_NODES.has(type))
  .map((name) =>
    name === 'heading' || name === 'codeBlock'
      ? { name, group: 'block', content: 'inline*' }
      : name === 'blockquote' || name === 'callout' || name === 'toggle'
        ? { name, group: 'block', content: 'block+' }
        : name.endsWith('List')
          ? { name, group: 'block', content: 'listItem+' }
          : name === 'image'
            ? { name, group: 'block', atom: true, attrs: z.object({ src: z.string().optional() }) }
            : { name, group: 'block', atom: true },
  );
const tableNodes: NodeSpec[] = [
  { name: 'table', group: 'block', content: 'tableRow+' },
  { name: 'tableRow', content: 'tableCell+' },
  {
    name: 'tableCell',
    content: 'block+',
    attrs: z.object({ colwidth: z.array(z.number()).nullable().optional() }),
  },
  { name: 'listItem', content: 'paragraph block*' },
];

const documentBlocks: EditorFeature = {
  id: 'documentBlocks',
  nodes: [...standIns, ...tableNodes, buttonNodeSpec, ...columnsNodeSpecs(), ...sectionNodeSpecs()],
  marks: [{ name: 'bold', htmlTag: 'strong' }],
};
const undoable: EditorFeature = { id: 'history', advanced: { prosePlugins: [history()] } };

const mounted: IEditor[] = [];

/** Destroys every editor `mount` made since the last call; a spec calls it after each case. */
export function destroyMounted(): void {
  for (const editor of mounted.splice(0)) editor.destroy();
}

/** Mounts a document editor with block layout and undo on `content`, in an element added to the page. */
export function mount(content: NodeJSON[], options: Parameters<typeof blockLayout>[0] = {}) {
  let engine: Editor | undefined;
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createDocumentEditor({
    features: [documentBlocks, blockLayout(options), undoable],
    content: { type: 'doc', content },
    element,
    onEngine: (raw) => {
      engine = raw as Editor;
    },
  });
  mounted.push(editor);
  return { editor, engine: engine as Editor };
}

/** A text node holding `value`. */
export const text = (value: string): NodeJSON => ({ type: 'text', text: value });
/** A paragraph holding `value`, or no text when it is empty. */
export const paragraph = (value: string, attrs: Record<string, unknown> = {}): NodeJSON => ({
  type: 'paragraph',
  attrs,
  content: value === '' ? [] : [text(value)],
});
/** An image of a fixed source, carrying `attrs` over it. */
export const image = (attrs: Record<string, unknown> = {}): NodeJSON => ({
  type: 'image',
  attrs: { src: 'https://x.test/a.png', ...attrs },
});
/** The attributes of the top-level block at `index`. */
export const top = (editor: IEditor, index = 0): Record<string, unknown> =>
  editor.getJSON().content?.[index]?.attrs ?? {};

/** Undoes the last step, answering whether there was one. */
export function undone(engine: Editor): boolean {
  return undo(engine.state, engine.view.dispatch);
}

/** Every node in `nodes`, at any depth, with its depth below the top. */
export function walk(nodes: readonly NodeJSON[], depth = 0): { node: NodeJSON; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...walk(node.content ?? [], depth + 1)]);
}

/** Whether a section sits anywhere but at the top of `doc`. */
export function sectionBelowTop(doc: DocJSON): boolean {
  return walk(doc.content ?? []).some(({ node, depth }) => node.type === 'section' && depth > 0);
}

/** Puts the caret at the end of the paragraph holding `value`. */
export function caretIn(engine: Editor, value: string): void {
  let end: number | undefined;
  engine.state.doc.descendants((node, pos) => {
    if (end === undefined && node.type.name === 'paragraph' && node.textContent === value)
      end = pos + node.nodeSize - 1;
    return end === undefined;
  });
  if (end === undefined) throw new Error(`no paragraph holds ${value}`);
  engine.commands.setTextSelection(end);
}

/** Whether a section sits inside another section anywhere in `doc`. */
export function sectionInSection(doc: DocJSON): boolean {
  const inside = (nodes: readonly NodeJSON[], inSection: boolean): boolean =>
    nodes.some(
      (node) =>
        (node.type === 'section' && inSection) || inside(node.content ?? [], inSection || node.type === 'section'),
    );
  return inside(doc.content ?? [], false);
}

/** Each block a section can be dropped into below the top, by how a reader names it, wrapping `content`. */
export const sectionHolders: Record<string, (content: NodeJSON[]) => NodeJSON> = {
  callout: (content) => ({ type: 'callout', content }),
  toggle: (content) => ({ type: 'toggle', content }),
  quote: (content) => ({ type: 'blockquote', content }),
  'list item': (content) => ({ type: 'bulletList', content: [{ type: 'listItem', content }] }),
  'table cell': (content) => ({
    type: 'table',
    content: [{ type: 'tableRow', content: [{ type: 'tableCell', content }] }],
  }),
  lane: (content) => ({
    type: 'columns',
    content: [
      { type: 'column', content },
      { type: 'column', content: [paragraph('right')] },
    ],
  }),
  section: (content) => ({ type: 'section', content }),
};
