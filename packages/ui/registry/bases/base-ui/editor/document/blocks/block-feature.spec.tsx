import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { defineBlock } from '@zeroxsolutions/editor-core/blocks/index';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { BlockMenuItem, DocJSON, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import { createCodecRegistry, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { choice, link, plainText, richText, toggle } from '@zeroxsolutions/editor-core/template/email/index';
import { standardKit } from '../features/standard/index';
import { Viewer } from '../react/viewer';
import { blockFeature, type BlockViewPropsOf } from './block-feature';

const note = defineBlock({
  type: 'note',
  label: 'Note',
  description: 'A titled note',
  keywords: ['memo'],
  fields: { title: plainText(), url: link(), text: richText() },
  attributes: { tone: choice(['plain', 'loud'], 'plain'), pinned: toggle(false) },
  document: {
    html: (view, markup) => markup`<h4>${view.fields.title}</h4>${view.body}<i>${view.attributes.tone}</i>`,
  },
});

function NoteView(props: BlockViewPropsOf<typeof note>): ReactNode {
  return (
    <div data-slot="note" data-tone={props.attributes.tone} data-pinned={String(props.attributes.pinned)}>
      <strong>{props.fields.title}</strong>
      <div data-slot="note-body">{props.body}</div>
      <span data-slot="note-editable">{String(props.editable)}</span>
      <span data-slot="note-blocks">{props.doc?.content?.length ?? 'none'}</span>
    </div>
  );
}

const feature = blockFeature(note, { view: NoteView, insert: { tone: 'loud', title: 'New', stray: 'x' } });
const reading = blockFeature(note, { view: NoteView, readsDocument: true });

const doc = (attrs: Record<string, unknown>, content?: NodeJSON[]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'note', attrs, ...(content ? { content } : {}) }],
});

const editors: IEditor[] = [];
function build(features = [standardKit(), feature], content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor();
  for (const one of features) builder.use(one);
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

/** The items the block menu draws for the selected block, as the menu reads them when it opens. */
function menuOf(editor: IEditor): BlockMenuItem[] {
  return collectUiContributions([feature]).blockMenu.flatMap((item) => item.items?.(editor) ?? [item]);
}

describe('blockFeature', () => {
  it("exports the definition's HTML", () => {
    const registry = createCodecRegistry([standardKit(), feature]);
    const stored = doc({ title: 'Hi' }, [{ type: 'text', text: 'Body' }]);
    expect(serialize(stored, 'html', registry)).toBe(
      serialize(stored, 'html', createCodecRegistry([{ id: 'note', codecs: [note.document!.codec] }])),
    );
  });

  it('draws the view in the Viewer with the fields, the defaults and the body', () => {
    const html = renderToStaticMarkup(
      <Viewer doc={doc({ title: 'Hi' }, [{ type: 'text', text: 'Body' }])} features={[standardKit(), feature]} />,
    );
    expect(html).toContain('data-tone="plain"');
    expect(html).toContain('data-pinned="false"');
    expect(html).toContain('<strong>Hi</strong>');
    expect(html).toContain('<div data-slot="note-body">Body</div>');
    expect(html).toContain('<span data-slot="note-editable">false</span>');
    expect(html).toContain('<span data-slot="note-blocks">none</span>');
  });

  it('hands a view that reads the document the document in the Viewer', () => {
    const stored: DocJSON = { type: 'doc', content: [...doc({}).content!, { type: 'paragraph' }] };
    const html = renderToStaticMarkup(<Viewer doc={stored} features={[standardKit(), reading]} />);
    expect(html).toContain('<span data-slot="note-blocks">2</span>');
  });

  it('inserts the block with the attributes it starts with, dropping what the node does not take', () => {
    const editor = build();
    expect(editor.run('insertBlock:note')).toBe(true);
    const inserted = editor.getJSON().content?.find((node) => node.type === 'note');
    expect(inserted?.attrs).toMatchObject({ tone: 'loud', title: 'New' });
    expect(inserted?.attrs).not.toHaveProperty('stray');
  });

  it('offers a slash item running its insert command', () => {
    expect(collectUiContributions([feature]).slash).toEqual([
      expect.objectContaining({
        id: 'block-note',
        title: 'Note',
        description: 'A titled note',
        group: 'Blocks',
        keywords: ['note', 'memo'],
        command: 'insertBlock:note',
      }),
    ]);
  });

  it('offers no attribute items while another block is selected', () => {
    const editor = build(undefined, { type: 'doc', content: [{ type: 'paragraph' }] });
    expect(menuOf(editor)).toEqual([]);
  });

  it('offers a radio per choice and a checkbox per toggle, checked by the defaults', () => {
    const editor = build(undefined, doc({}));
    editor.focus(1);
    const items = menuOf(editor);
    expect(items.map(({ title, group, checkbox }) => ({ title, group, checkbox }))).toEqual([
      { title: 'Plain', group: 'Tone', checkbox: undefined },
      { title: 'Loud', group: 'Tone', checkbox: undefined },
      { title: 'Pinned', group: undefined, checkbox: true },
    ]);
    expect(items.map((item) => item.active?.(editor))).toEqual([true, false, false]);
  });

  it('sets an attribute from its item', () => {
    const editor = build(undefined, doc({}));
    editor.focus(1);
    for (const title of ['Loud', 'Pinned']) {
      const item = menuOf(editor).find((candidate) => candidate.title === title)!;
      expect(editor.run(item.command, item.args)).toBe(true);
    }
    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({ tone: 'loud', pinned: true });
    expect(menuOf(editor).map((item) => item.active?.(editor))).toEqual([false, true, true]);
  });

  it('refuses a definition with no document side', () => {
    const emailOnly = { ...note, document: null };
    expect(() => blockFeature(emailOnly, { view: NoteView })).toThrow(/no document side/);
  });
});
