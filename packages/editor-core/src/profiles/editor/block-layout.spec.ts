import { history, undo } from '@tiptap/pm/history';
import { z } from 'zod';
import { afterEach, describe, expect, it } from 'vitest';
import type { Editor } from '../../document/advanced.js';
import { createDocumentEditor } from '../../document/core/create-document-editor.js';
import type { DocJSON, EditorFeature, IEditor, NodeJSON, NodeSpec } from '../../document/core/types/index.js';
import { createCodecRegistry, serialize } from '../../document/serialize/index.js';
import { LAYOUT_NODES, type Layout } from '../../template/layout/index.js';
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
afterEach(() => {
  for (const editor of mounted.splice(0)) editor.destroy();
});

function mount(content: NodeJSON[], options: Parameters<typeof blockLayout>[0] = {}) {
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

const text = (value: string): NodeJSON => ({ type: 'text', text: value });
const paragraph = (value: string, attrs: Record<string, unknown> = {}): NodeJSON => ({
  type: 'paragraph',
  attrs,
  content: value === '' ? [] : [text(value)],
});
const image = (attrs: Record<string, unknown> = {}): NodeJSON => ({
  type: 'image',
  attrs: { src: 'https://x.test/a.png', ...attrs },
});
const top = (editor: IEditor, index = 0): Record<string, unknown> => editor.getJSON().content?.[index]?.attrs ?? {};

function undone(engine: Editor): boolean {
  return undo(engine.state, engine.view.dispatch);
}

function paste(engine: Editor, html: string): void {
  engine.view.pasteHTML(html, new Event('paste') as ClipboardEvent);
}

/** Every node in `nodes`, at any depth, with its depth below the top. */
function walk(nodes: readonly NodeJSON[], depth = 0): { node: NodeJSON; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...walk(node.content ?? [], depth + 1)]);
}

/** Whether a section sits anywhere but at the top of `doc`. */
function sectionBelowTop(doc: DocJSON): boolean {
  return walk(doc.content ?? []).some(({ node, depth }) => node.type === 'section' && depth > 0);
}

/** Puts the caret at the end of the paragraph holding `value`. */
function caretIn(engine: Editor, value: string): void {
  let end: number | undefined;
  engine.state.doc.descendants((node, pos) => {
    if (end === undefined && node.type.name === 'paragraph' && node.textContent === value)
      end = pos + node.nodeSize - 1;
    return end === undefined;
  });
  if (end === undefined) throw new Error(`no paragraph holds ${value}`);
  engine.commands.setTextSelection(end);
}

function sectionInSection(doc: DocJSON): boolean {
  const inside = (nodes: readonly NodeJSON[], inSection: boolean): boolean =>
    nodes.some(
      (node) =>
        (node.type === 'section' && inSection) || inside(node.content ?? [], inSection || node.type === 'section'),
    );
  return inside(doc.content ?? [], false);
}

describe('blockLayout', () => {
  it('sets an image layout in one undo step', () => {
    const { editor, engine } = mount([image(), paragraph('after')]);
    expect(editor.run('setBlockLayout', { pos: 0, layout: { align: 'center', width: 0.5 } })).toBe(true);
    expect(top(editor)).toMatchObject({ align: 'center', width: 0.5 });
    expect(undone(engine)).toBe(true);
    expect(top(editor)).toMatchObject({ align: null, width: null });
  });

  it('snaps a width to a twentieth inside a quarter and the whole', () => {
    const { editor } = mount([image()]);
    editor.run('setBlockLayout', { pos: 0, layout: { width: 0.512 } });
    expect(top(editor).width).toBe(0.5);
    editor.run('setBlockLayout', { pos: 0, layout: { width: 0.1 } });
    expect(top(editor).width).toBe(0.25);
  });

  it('sets no width on a paragraph, and space before on it', () => {
    const { editor } = mount([paragraph('x')]);
    expect(editor.can('setBlockLayout', { pos: 0, layout: { width: 0.5 } })).toBe(false);
    expect(editor.run('setBlockLayout', { pos: 0, layout: { spaceBefore: 'large' } })).toBe(true);
    expect(top(editor).spaceBefore).toBe('large');
  });

  it('takes only the full width on a table', () => {
    const table: NodeJSON = {
      type: 'table',
      content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [paragraph('a')] }] }],
    };
    const { editor } = mount([table]);
    expect(editor.can('setBlockLayout', { pos: 0, layout: { width: 0.5 } })).toBe(false);
    expect(editor.run('setBlockLayout', { pos: 0, layout: { width: 'full' } })).toBe(true);
  });

  describe('in HTML', () => {
    const VALUES: Required<Omit<Layout, 'responsive'>> = {
      align: 'center',
      width: 0.5,
      spaceBefore: 'small',
      spaceAfter: 'large',
    };

    function nodeOf(type: string, attrs: Record<string, unknown>): NodeJSON {
      switch (type) {
        case 'paragraph':
          return paragraph('x', attrs);
        case 'heading':
        case 'codeBlock':
          return { type, attrs, content: [text('x')] };
        case 'blockquote':
        case 'callout':
          return { type, attrs, content: [paragraph('x')] };
        case 'bulletList':
        case 'orderedList':
        case 'taskList':
          return { type, attrs, content: [{ type: 'listItem', content: [paragraph('x')] }] };
        case 'table':
          return {
            type,
            attrs,
            content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [paragraph('x')] }] }],
          };
        case 'columns':
          return {
            type,
            attrs,
            content: [
              { type: 'column', content: [paragraph('l')] },
              { type: 'column', content: [paragraph('r')] },
            ],
          };
        case 'section':
          return { type, attrs, content: [paragraph('x')] };
        default:
          return { type, attrs: { ...attrs, ...(type === 'image' ? { src: 'https://x.test/a.png' } : {}) } };
      }
    }

    it.each(Object.entries(LAYOUT_NODES))(
      'keeps the layout of a %s through an HTML export and import',
      (type, keys) => {
        const attrs = Object.fromEntries(
          keys.map((key) => [key, key === 'width' && type === 'table' ? 'full' : VALUES[key as keyof typeof VALUES]]),
        );
        const html = mount([nodeOf(type, attrs)]).engine.getHTML();
        const target = mount([paragraph('')]);
        target.engine.commands.setContent(html);
        expect(target.editor.getJSON().content?.[0].attrs).toMatchObject(attrs);
      },
    );

    it('keeps the text in Markdown and drops the layout', () => {
      const doc: DocJSON = {
        type: 'doc',
        content: [paragraph('Lead', { textAlign: 'center', size: 'lead', spaceBefore: 'large' })],
      };
      expect(serialize(doc, 'markdown', createCodecRegistry([]))).toBe('Lead');
    });
  });

  it('opens a stored image width of 360px as 0.5 and pixel column widths as fractions, with no undo step', () => {
    const table: NodeJSON = {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: { colwidth: [100] }, content: [paragraph('a')] },
            { type: 'tableCell', attrs: { colwidth: [300] }, content: [paragraph('b')] },
          ],
        },
      ],
    };
    const { editor, engine } = mount([image({ width: 360 }), table]);
    expect(top(editor, 0).width).toBe(0.5);
    expect(top(editor, 1).columnWidths).toEqual([0.25, 0.75]);
    expect(JSON.stringify(editor.getJSON())).not.toContain('colwidth":[');
    expect(undone(engine)).toBe(false);
    editor.setContent({ type: 'doc', content: [image({ width: 720 })] });
    expect(top(editor).width).toBe(1);
  });

  it('maps pasted inline styles onto tokens, or drops them', () => {
    const { editor, engine } = mount([paragraph('')]);
    // Whole paragraphs around it, since a lone pasted paragraph merges into the one the caret is in.
    paste(engine, '<p>a</p><p style="color:#ff0000;text-align:right;width:300px;background:rgb(1,2,3)">Hi</p><p>b</p>');
    const pasted = walk(editor.getJSON().content ?? []).map(({ node }) => node);
    expect(pasted.find((node) => node.content?.[0]?.text === 'Hi')?.attrs).toMatchObject({ textAlign: 'end' });
    expect(pasted.flatMap((node) => node.marks ?? [])).toEqual([]);
    paste(engine, '<p><span style="color:red">x</span><span style="background:teal">y</span></p>');
    const marks = walk(editor.getJSON().content ?? []).flatMap(({ node }) => node.marks ?? []);
    expect(marks).toEqual(
      expect.arrayContaining([
        { type: 'textColor', attrs: { token: 'red' } },
        { type: 'textBackground', attrs: { token: 'teal' } },
      ]),
    );
    const json = JSON.stringify(editor.getJSON());
    expect(json).not.toMatch(/\d+px/);
    expect(json).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it('colours and uncolours the selection in one undo step each', () => {
    const { editor, engine } = mount([paragraph('colour me')]);
    engine.commands.setTextSelection({ from: 1, to: 7 });
    expect(editor.run('setTextColor', { token: 'violet' })).toBe(true);
    expect(editor.run('setTextBackground', { token: 'amber' })).toBe(true);
    expect(editor.getJSON().content?.[0].content?.[0].marks).toEqual([
      { type: 'textColor', attrs: { token: 'violet' } },
      { type: 'textBackground', attrs: { token: 'amber' } },
    ]);
    expect(editor.run('setTextColor', { token: null })).toBe(true);
    expect(editor.getJSON().content?.[0].content?.[0].marks).toEqual([
      { type: 'textBackground', attrs: { token: 'amber' } },
    ]);
    expect(undone(engine)).toBe(true);
    expect(editor.getJSON().content?.[0].content?.[0].marks).toHaveLength(2);
  });

  it('aligns every paragraph of the selection, in a quote too, and sizes paragraphs', () => {
    const quote: NodeJSON = { type: 'blockquote', content: [paragraph('quoted')] };
    const { editor, engine } = mount([paragraph('one'), quote, { type: 'heading', content: [text('title')] }]);
    engine.commands.setTextSelection({ from: 1, to: engine.state.doc.content.size - 1 });
    expect(editor.run('setTextAlign', { align: 'center' })).toBe(true);
    const aligned = walk(editor.getJSON().content ?? []).filter(
      ({ node }) => node.type === 'paragraph' || node.type === 'heading',
    );
    expect(aligned.map(({ node }) => node.attrs?.textAlign)).toEqual(['center', 'center', 'center']);
    expect(editor.run('setParagraphSize', { size: 'lead' })).toBe(true);
    expect(walk(editor.getJSON().content ?? []).filter(({ node }) => node.attrs?.size === 'lead')).toHaveLength(2);
    expect(editor.run('setTextAlign', { align: null })).toBe(true);
    expect(top(editor).textAlign).toBeNull();
  });

  it('weighs, adds, removes and aligns columns', () => {
    const columns: NodeJSON = {
      type: 'columns',
      content: [
        { type: 'column', content: [paragraph('left')] },
        { type: 'column', content: [paragraph('right')] },
      ],
    };
    const { editor } = mount([columns]);
    expect(editor.run('setColumnsLayout', { pos: 0, ratio: [8, 4], valign: 'center' })).toBe(true);
    expect(top(editor)).toMatchObject({ ratio: [8, 4], valign: 'center' });
    expect(editor.can('setColumnsLayout', { pos: 0, ratio: [1, 1, 1] })).toBe(false);
    expect(editor.run('setColumnsLayout', { pos: 0, lanes: 3 })).toBe(true);
    expect(editor.getJSON().content?.[0].content).toHaveLength(3);
    expect(top(editor).ratio).toEqual([1, 1, 1]);
    expect(editor.run('setColumnsLayout', { pos: 0, lanes: 2 })).toBe(true);
    expect(editor.run('setColumnsLayout', { pos: 0, lanes: 1 })).toBe(false);
    editor.run('setColumnsLayout', { pos: 0, lanes: 4 });
    expect(editor.can('setColumnsLayout', { pos: 0, lanes: 5 })).toBe(false);
    editor.run('setColumnsLayout', { pos: 0, lanes: 2 });
    expect(
      walk(editor.getJSON().content ?? [])
        .filter(({ node }) => node.type === 'text')
        .map(({ node }) => node.text),
    ).toEqual(['left', 'right']);
  });

  it('keeps the text of a removed lane in the lane before it', () => {
    const columns: NodeJSON = {
      type: 'columns',
      content: [
        { type: 'column', content: [paragraph('a')] },
        { type: 'column', content: [paragraph('b')] },
        { type: 'column', content: [paragraph('c')] },
      ],
    };
    const { editor } = mount([columns]);
    editor.run('setColumnsLayout', { pos: 0, lanes: 2 });
    const lanes = editor.getJSON().content?.[0].content ?? [];
    expect(
      lanes.map((lane) =>
        walk(lane.content ?? [])
          .filter(({ node }) => node.type === 'text')
          .map(({ node }) => node.text),
      ),
    ).toEqual([['a'], ['b', 'c']]);
  });

  it('sets a table column widths and a section layout', () => {
    const table: NodeJSON = {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [paragraph('a')] },
            { type: 'tableCell', content: [paragraph('b')] },
          ],
        },
      ],
    };
    const section: NodeJSON = { type: 'section', content: [paragraph('in')] };
    const { editor, engine } = mount([table, section]);
    expect(editor.run('setTableLayout', { pos: 0, columnWidths: [0.3, 0.7] })).toBe(true);
    expect(top(editor).columnWidths).toEqual([0.3, 0.7]);
    expect(editor.can('setTableLayout', { pos: 0, columnWidths: [1] })).toBe(false);
    const sectionPos = engine.state.doc.child(0).nodeSize;
    expect(
      editor.run('setSectionLayout', {
        pos: sectionPos,
        layout: { background: 'teal', padding: 'large', width: 'full' },
      }),
    ).toBe(true);
    expect(top(editor, 1)).toMatchObject({ background: 'teal', padding: 'large', width: 'full' });
    expect(editor.can('setSectionLayout', { pos: 0, layout: { background: 'teal' } })).toBe(false);
  });

  it('opens a section inside a section with its blocks in its place, by setContent and on mount', () => {
    const nested: NodeJSON = {
      type: 'section',
      content: [paragraph('before'), { type: 'section', content: [paragraph('deep')] }, paragraph('after')],
    };
    const { editor, engine } = mount([{ type: 'section', content: [paragraph('in')] }]);
    editor.setContent({ type: 'doc', content: [nested] });
    expect(editor.getJSON().content?.[0].content?.map((node) => node.content?.[0]?.text)).toEqual([
      'before',
      'deep',
      'after',
    ]);
    expect(mount([nested]).editor.getJSON()).toEqual(editor.getJSON());
    const copied = mount([{ type: 'section', content: [paragraph('copied')] }]);
    const html = copied.engine.getHTML();
    engine.commands.setTextSelection(2);
    paste(engine, html);
    expect(sectionInSection(editor.getJSON())).toBe(false);
    expect(walk(editor.getJSON().content ?? []).some(({ node }) => node.text?.includes('copied'))).toBe(true);
  });

  describe('keeps a section at the top of the document', () => {
    const inner = paragraph('inner');
    const holders: Record<string, (content: NodeJSON[]) => NodeJSON> = {
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

    it.each(Object.entries(holders))('unwraps one in a %s, by setContent and by paste', (_, holder) => {
      const { editor, engine } = mount([holder([inner])]);
      editor.setContent({ type: 'doc', content: [holder([{ type: 'section', content: [paragraph('deep')] }])] });
      expect(sectionBelowTop(editor.getJSON())).toBe(false);
      expect(walk(editor.getJSON().content ?? []).some(({ node }) => node.text === 'deep')).toBe(true);
      const opened = mount([holder([{ type: 'section', content: [paragraph('deep')] }])]).editor.getJSON();
      expect(opened).toEqual(editor.getJSON());
      editor.setContent({ type: 'doc', content: [holder([inner])] });
      const html = mount([{ type: 'section', content: [paragraph('copied')] }]).engine.getHTML();
      caretIn(engine, 'inner');
      paste(engine, html);
      expect(sectionBelowTop(editor.getJSON())).toBe(false);
      expect(walk(editor.getJSON().content ?? []).some(({ node }) => node.text?.includes('copied'))).toBe(true);
    });

    it.each(Object.entries(holders))('offers no section to insert in a %s', (_, holder) => {
      const { editor, engine } = mount([holder([inner]), paragraph('after')]);
      caretIn(engine, 'inner');
      expect(editor.can('insertSection')).toBe(false);
      expect(editor.run('insertSection')).toBe(false);
      caretIn(engine, 'after');
      expect(editor.can('insertSection')).toBe(true);
    });

    it('inserts one at the top holding an empty line', () => {
      const { editor, engine } = mount([paragraph('top')]);
      caretIn(engine, 'top');
      expect(editor.run('insertSection')).toBe(true);
      expect(editor.getJSON().content?.map((node) => node.type)).toEqual(['paragraph', 'section']);
      expect(editor.getJSON().content?.[1]?.content).toMatchObject([{ type: 'paragraph' }]);
      expect(editor.getJSON().content?.[1]?.content?.[0]?.content).toBeUndefined();
    });
  });

  it('refuses in the email what the email cannot draw', () => {
    const { editor, engine } = mount([image(), paragraph('x'), { type: 'section', content: [paragraph('in')] }], {
      email: true,
    });
    engine.commands.setTextSelection(2);
    expect(editor.can('setBlockLayout', { pos: 0, layout: { width: 'full' } })).toBe(false);
    expect(editor.can('setBlockLayout', { pos: 0, layout: { width: 1 } })).toBe(true);
    expect(editor.can('setTextAlign', { align: 'justify' })).toBe(false);
    expect(editor.can('setTextAlign', { align: 'end' })).toBe(true);
    const sectionPos = 1 + 3;
    expect(editor.can('setSectionLayout', { pos: sectionPos, layout: { width: 'full' } })).toBe(false);
    expect(editor.can('setSectionLayout', { pos: sectionPos, layout: { width: 'wide' } })).toBe(true);
  });

  it('weighs a lane count changed with no ratio as equal lanes, within the host bound', () => {
    const columns: NodeJSON = {
      type: 'columns',
      attrs: { ratio: [8, 4] },
      content: [
        { type: 'column', content: [paragraph('left')] },
        { type: 'column', content: [paragraph('right')] },
      ],
    };
    const { editor } = mount([columns], { lanes: 3 });
    expect(editor.run('setColumnsLayout', { pos: 0, lanes: 3 })).toBe(true);
    expect(top(editor).ratio).toEqual([1, 1, 1]);
    expect(editor.can('setColumnsLayout', { pos: 0, lanes: 4 })).toBe(false);
    expect(editor.run('setColumnsLayout', { pos: 0, lanes: 2 })).toBe(true);
    expect(top(editor).ratio).toEqual([1, 1]);
  });

  it('refuses every layout change to a block the host keeps from changing, and keeps colouring its text', () => {
    const table: NodeJSON = {
      type: 'table',
      content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [paragraph('a')] }] }],
    };
    const columns: NodeJSON = {
      type: 'columns',
      content: [
        { type: 'column', content: [paragraph('l')] },
        { type: 'column', content: [paragraph('r')] },
      ],
    };
    const { editor, engine } = mount(
      [image(), paragraph('text'), { type: 'section', content: [paragraph('in')] }, table, columns],
      { changeable: () => false },
    );
    const at = (type: string) => {
      let found = -1;
      engine.state.doc.forEach((node, offset) => {
        if (found < 0 && node.type.name === type) found = offset;
      });
      return found;
    };
    expect(editor.can('setBlockLayout', { pos: 0, layout: { align: 'center' } })).toBe(false);
    expect(editor.can('setSectionLayout', { pos: at('section'), layout: { background: 'teal' } })).toBe(false);
    expect(editor.can('setTableLayout', { pos: at('table'), columnWidths: null })).toBe(false);
    expect(editor.can('setColumnsLayout', { pos: at('columns'), valign: 'center' })).toBe(false);
    caretIn(engine, 'text');
    expect(editor.can('setTextAlign', { align: 'center' })).toBe(false);
    expect(editor.can('setParagraphSize', { size: 'lead' })).toBe(false);
    engine.commands.setTextSelection({ from: at('paragraph') + 1, to: at('paragraph') + 3 });
    expect(editor.run('setTextColor', { token: 'teal' })).toBe(true);
  });

  it('asks the host about the block around a paragraph it aligns', () => {
    const quote: NodeJSON = { type: 'blockquote', content: [paragraph('quoted')] };
    const { editor, engine } = mount([quote, paragraph('free')], {
      changeable: (_editor, pos) => engine.state.doc.nodeAt(pos)?.type.name !== 'blockquote',
    });
    caretIn(engine, 'quoted');
    expect(editor.can('setTextAlign', { align: 'end' })).toBe(false);
    caretIn(engine, 'free');
    expect(editor.can('setTextAlign', { align: 'end' })).toBe(true);
  });

  it('takes no layout on a card in the email, whose wire carries none', () => {
    const { editor } = mount([{ type: 'card' }, image()], { email: true });
    expect(editor.can('setBlockLayout', { pos: 0, layout: { width: 0.5 } })).toBe(false);
    expect(editor.can('setBlockLayout', { pos: 0, layout: { align: 'center' } })).toBe(false);
    expect(editor.getJSON().content?.[0].attrs ?? {}).not.toHaveProperty('width');
    expect(editor.can('setBlockLayout', { pos: 1, layout: { width: 0.5 } })).toBe(true);
  });
});
