import { history } from '@tiptap/pm/history';
import { z } from 'zod';
import type { Editor } from '../../document/advanced.js';
import { createDocumentEditor } from '../../document/core/create-document-editor.js';
import type { EditorFeature, IEditor, NodeJSON, NodeSpec } from '../../document/core/types/index.js';
import { blockIdentity, type BlockIdentityOptions } from './block-identity.js';
import { buttonNodeSpec, columnsNodeSpecs, emailNodeSpecs, sectionNodeSpecs } from '../core/email-nodes.js';

// Stand-ins for the document's own callout and rule, which live outside editor-core; the callout holds
// inline text here so a caret in it sits in the block itself.
const documentNodes: NodeSpec[] = [
  {
    name: 'callout',
    group: 'block',
    content: 'inline*',
    defining: true,
    attrs: z.object({ variant: z.string().optional(), align: z.string().optional() }),
  },
  { name: 'horizontalRule', group: 'block', atom: true },
];

const email: EditorFeature = {
  id: 'email',
  nodes: [...documentNodes, buttonNodeSpec, ...columnsNodeSpecs(), ...sectionNodeSpecs(), ...emailNodeSpecs.nodes],
  marks: [{ name: 'bold', htmlTag: 'strong' }, ...emailNodeSpecs.marks],
};

/** The engine's undo history, for a case that undoes. */
export const undoable: EditorFeature = { id: 'history', advanced: { prosePlugins: [history()] } };

/** A block's attributes as these cases set them: its host id and its key, either of which may be absent. */
export type Attrs = Record<string, unknown> & { id?: string | null; key?: string | null };

/** A paragraph holding `text`, or no text when it is empty. */
export function paragraph(text: string, attrs: Attrs = {}): NodeJSON {
  return { type: 'paragraph', attrs, content: text ? [{ type: 'text', text }] : [] };
}

/** A callout holding `text` inline, so a caret in it sits in the block itself. */
export function callout(text: string, attrs: Attrs = {}): NodeJSON {
  return { type: 'callout', attrs, content: [{ type: 'text', text }] };
}

/** An email button carrying `attrs`. */
export function button(attrs: Attrs): NodeJSON {
  return { type: 'button', attrs };
}

const mounted: IEditor[] = [];

/** Destroys every editor `mount` made since the last call; a spec calls it after each case. */
export function destroyMounted(): void {
  for (const editor of mounted.splice(0)) editor.destroy();
}

/** Mounts an email editor with block identity on `content`, in an element added to the page. */
export function mount(content: NodeJSON[], options: BlockIdentityOptions = {}, extra: EditorFeature[] = []) {
  let engine: Editor | undefined;
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createDocumentEditor({
    features: [email, blockIdentity(options), ...extra],
    content: { type: 'doc', content },
    element,
    onEngine: (raw) => {
      engine = raw as Editor;
    },
  });
  mounted.push(editor);
  return { editor, engine: engine as Editor };
}

/** Each top-level block's type, host id and key, a missing one read as null. */
export function blocks(editor: IEditor): Array<{ type: string; id: unknown; key: unknown }> {
  return (editor.getJSON().content ?? []).map((block) => ({
    type: block.type,
    id: (block.attrs as Attrs | undefined)?.id ?? null,
    key: (block.attrs as Attrs | undefined)?.key ?? null,
  }));
}

/** Whether every top-level block holds a non-empty key no other block holds. */
export function keysAreUnique(editor: IEditor): boolean {
  const keys = blocks(editor).map((block) => block.key);
  return keys.every((key) => typeof key === 'string' && key.length > 0) && new Set(keys).size === keys.length;
}

/** Copies the document's first `count` top-level blocks as the clipboard would carry them. */
export function copyBlocks(engine: Editor, count = 1): string {
  let size = 0;
  for (let index = 0; index < count; index += 1) size += engine.state.doc.child(index).nodeSize;
  return engine.view.serializeForClipboard(engine.state.doc.slice(0, size)).dom.innerHTML;
}
