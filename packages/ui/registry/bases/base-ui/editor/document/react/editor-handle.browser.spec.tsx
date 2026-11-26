import * as React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../test/nova-style.css';
// The editor's own sheet, which places the handle in the gutter and takes the pointer from it while it is
// hidden. Without it the hidden handle sits in the flow under the block, and a pointer an earlier spec
// file left resting there enters it before the spec hovers it.
import '../../styles.css';
import { defineFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { codeBlock } from '../features/code-block/index';
import { columns as columnsFeature } from '../features/columns/index';
import { standardKit } from '../features/standard/index';
import { table } from '../features/table/index';
import { Editor } from './editor';

const handles = vi.hoisted(() => {
  const make = () => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() });
  return { grip: make(), plus: make() };
});

function mockedIcon(handle: { startAnimation: () => void; stopAnimation: () => void }) {
  return React.forwardRef<unknown, { size?: number }>((_props, ref) => {
    React.useImperativeHandle(ref, () => handle);
    return <span style={{ display: 'inline-block', width: 16, height: 16 }} />;
  });
}

vi.mock('@/registry/bases/base-ui/icons/lucide/grip-vertical-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/grip-vertical-icon')>()),
  GripVerticalIcon: mockedIcon(handles.grip),
}));
vi.mock('@/registry/bases/base-ui/icons/lucide/plus-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/plus-icon')>()),
  PlusIcon: mockedIcon(handles.plus),
}));

const content: DocJSON = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a block' }] }],
};

/** Mount the real editor and move the pointer over its block, which makes the extension show its handle. */
async function mountWithHandle() {
  await render(
    <div className="style-nova" style={{ padding: '0 80px' }}>
      <Editor features={[standardKit()]} content={content} />
    </div>,
  );
  const block = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('.ProseMirror p');
    if (!found) throw new Error('the editor is not mounted');
    return found;
  });
  await userEvent.hover(block);
  const handle = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('.drag-handle');
    if (!found || found.classList.contains('hide')) throw new Error('the handle is hidden');
    return found;
  });
  return { block, handle };
}

describe('the block handle of the document editor', () => {
  it('starts the grip while the pointer is on the handle and stops it on leave', async () => {
    const { block, handle } = await mountWithHandle();
    await userEvent.hover(handle);
    expect(handles.grip.startAnimation).toHaveBeenCalledTimes(1);
    await userEvent.hover(block);
    expect(handles.grip.stopAnimation).toHaveBeenCalledTimes(1);
  });

  it('starts the plus while the pointer is on it and stops it on leave', async () => {
    const { block } = await mountWithHandle();
    const plus = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('[data-editor-add]');
      if (!found) throw new Error('no plus');
      return found;
    });
    await userEvent.hover(plus);
    expect(handles.plus.startAnimation).toHaveBeenCalledTimes(1);
    await userEvent.hover(block);
    expect(handles.plus.stopAnimation).toHaveBeenCalledTimes(1);
  });

  it('keeps the handle and the plus shown while the pointer crosses onto them, with their cursors', async () => {
    const { handle } = await mountWithHandle();
    const plus = () => document.querySelector<HTMLElement>('[data-editor-add]');
    // The element under the pointer at a control's centre, which is the icon inside it, not the control.
    const cursorAt = (control: HTMLElement) => {
      const rect = control.getBoundingClientRect();
      const under = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return under ? getComputedStyle(under).cursor : null;
    };

    await userEvent.hover(handle);
    expect(handle.classList.contains('hide')).toBe(false);
    expect(plus()).not.toBeNull();
    expect(cursorAt(handle)).toBe('grab');

    await userEvent.hover(plus()!);
    expect(handle.classList.contains('hide')).toBe(false);
    expect(plus()).not.toBeNull();
    expect(cursorAt(plus()!)).toBe('pointer');

    await userEvent.hover(handle);
    expect(handle.classList.contains('hide')).toBe(false);
    expect(plus()).not.toBeNull();
  });
});

const paragraphs = (...texts: string[]): DocJSON => ({
  type: 'doc',
  content: texts.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
});

/** Mounts the editor on `content` and points at its top-level block at `index`, so the handle sits beside it. */
async function mountDocument(content: DocJSON, index: number, extra: EditorFeature[] = []) {
  let editor: IEditor | undefined;
  await render(
    <div className="style-nova" style={{ padding: '0 80px' }}>
      <Editor features={[standardKit(), ...extra]} content={content} onReady={(ready: IEditor) => (editor = ready)} />
    </div>,
  );
  const blocks = await vi.waitFor(() => {
    const found = Array.from(document.querySelectorAll<HTMLElement>('.ProseMirror > *'));
    // A document ending on a block other than a paragraph opens with the trailing line below it.
    if (found.length < (content.content?.length ?? 0)) throw new Error('the editor is not mounted');
    return found;
  });
  await userEvent.hover(blocks[index]);
  const handle = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('.drag-handle');
    if (!found || found.classList.contains('hide')) throw new Error('the handle is hidden');
    return found;
  });
  const textsNow = () => (editor!.getJSON().content ?? []).map((block) => block.content?.[0]?.text);
  return { blocks, handle, texts: textsNow, editor: () => editor! };
}

function mountBlocks(texts: string[], index: number, extra: EditorFeature[] = []) {
  return mountDocument(paragraphs(...texts), index, extra);
}

const line = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

async function turnInto(handle: HTMLElement, choice: string) {
  await userEvent.click(handle);
  await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
  await userEvent.click(page.getByRole('menuitemradio', { name: choice, exact: true }));
}

const types = (editor: IEditor) => (editor.getJSON().content ?? []).map((block) => block.type);

const bullets = (...texts: string[]) => ({
  type: 'bulletList',
  content: texts.map((text) => ({ type: 'listItem', content: [line(text)] })),
});

/** The text of each item of the top-level list at `index`. */
const itemsOf = (editor: IEditor, index: number) =>
  (editor.getJSON().content?.[index]?.content ?? []).map((item) => item.content?.[0]?.content?.[0]?.text);

/** The element `selector` matches whose text is `text`. */
function holding(selector: string, text: string): HTMLElement {
  const found = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
    (candidate) => candidate.textContent === text,
  );
  if (!found) throw new Error(`no ${selector} holds ${text}`);
  return found;
}

/** Points at the left of `element`'s first line, as an author reaching for its grip does, and waits for the
 *  handle to sit beside that line, or beside `besides` when the handle stands beside a block holding it. */
async function gripBeside(element: HTMLElement, besides = element): Promise<HTMLElement> {
  await userEvent.hover(element, { position: { x: 4, y: 4 } });
  return vi.waitFor(() => {
    const handle = document.querySelector<HTMLElement>('.drag-handle');
    const top = handle?.getBoundingClientRect().top ?? -1;
    const rect = besides.getBoundingClientRect();
    if (!handle || handle.classList.contains('hide') || top < rect.top - 12 || top > rect.bottom) {
      throw new Error('the handle is not beside the element');
    }
    return handle;
  });
}

/** Points at the list item holding `text`, so the handle sits beside that item rather than its list. */
function gripBesideItem(text: string): Promise<HTMLElement> {
  return gripBeside(holding('.ProseMirror li', text));
}

describe('the block menu the grip opens', () => {
  it('opens a Block actions menu with Duplicate and Delete on a click of the grip', async () => {
    const { handle } = await mountBlocks(['first', 'second'], 1);
    await userEvent.click(handle);
    const menu = page.getByRole('menu', { name: 'Block actions' });
    await expect.element(menu).toBeVisible();
    await expect.element(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();
    await expect.element(menu.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  it('deletes the block under the grip and no other', async () => {
    const { handle, texts } = await mountBlocks(['first', 'second'], 1);
    await userEvent.click(handle);
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(texts()).toEqual(['first']));
  });

  it('duplicates the block under the grip below it', async () => {
    const { handle, texts } = await mountBlocks(['first', 'second'], 1);
    await userEvent.click(handle);
    await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() => expect(texts()).toEqual(['first', 'second', 'second']));
  });

  it('gives the text back the focus once a menu item ran, so Mod-Z undoes it at once', async () => {
    const { handle, texts } = await mountBlocks(['first', 'second'], 0);
    await userEvent.click(handle);
    await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() => expect(texts()).toEqual(['first', 'first', 'second']));

    await vi.waitFor(() => expect(document.activeElement?.classList.contains('ProseMirror')).toBe(true));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');

    await vi.waitFor(() => expect(texts()).toEqual(['first', 'second']));
  });

  it('turns the block into a heading from Turn into', async () => {
    const { handle, editor } = await mountBlocks(['first', 'second'], 1);
    await userEvent.click(handle);
    await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Heading 1' }));
    await vi.waitFor(() => expect(types(editor()).slice(0, 2)).toEqual(['paragraph', 'heading']));
  });

  it('turns a bulleted list into a top-level heading with no list left', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ type: 'bulletList', content: [{ type: 'listItem', content: [line('item')] }] }, line('after')],
    };
    const { handle, editor } = await mountDocument(doc, 0);
    await turnInto(handle, 'Heading 1');
    await vi.waitFor(() => expect(JSON.stringify(editor().getJSON())).not.toContain('bulletList'));
    expect(editor().getJSON().content?.[0]).toMatchObject({ type: 'heading', content: [{ text: 'item' }] });
  });

  it('turns a paragraph into a bulleted list', async () => {
    const { handle, editor } = await mountBlocks(['first', 'second'], 0);
    await turnInto(handle, 'Bulleted list');
    await vi.waitFor(() => expect(types(editor())).toEqual(['bulletList', 'paragraph']));
  });

  it('turns a quote into text', async () => {
    const doc: DocJSON = { type: 'doc', content: [{ type: 'blockquote', content: [line('said')] }, line('after')] };
    const { handle, editor } = await mountDocument(doc, 0);
    await turnInto(handle, 'Text');
    await vi.waitFor(() => expect(types(editor())).toEqual(['paragraph', 'paragraph']));
    expect(editor().getJSON().content?.[0]).toMatchObject({ content: [{ text: 'said' }] });
  });

  it('opens the same menu on the block holding the caret with Mod-/', async () => {
    const { blocks } = await mountBlocks(['first', 'second'], 0);
    await userEvent.click(blocks[1]);
    await userEvent.keyboard('{Control>}/{/Control}');
    await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(document.querySelectorAll('.ProseMirror > *')).toHaveLength(1));
    expect(document.querySelector('.ProseMirror')?.textContent).toBe('first');
  });

  it('deletes only the list item whose grip opened the menu', async () => {
    const doc: DocJSON = { type: 'doc', content: [bullets('one', 'two', 'three'), line('after')] };
    const { editor } = await mountDocument(doc, 1);
    await userEvent.click(await gripBesideItem('three'));
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(itemsOf(editor(), 0)).toEqual(['one', 'two']));
    expect(types(editor())).toEqual(['bulletList', 'paragraph']);
  });

  it('turns only the list item whose grip opened the menu into text, out of its list', async () => {
    const doc: DocJSON = { type: 'doc', content: [bullets('one', 'two', 'three'), line('after')] };
    const { editor } = await mountDocument(doc, 1);
    await turnInto(await gripBesideItem('two'), 'Text');
    await vi.waitFor(() => expect(types(editor())).toEqual(['bulletList', 'paragraph', 'bulletList', 'paragraph']));
    expect(editor().getJSON().content?.[1]).toMatchObject({ content: [{ text: 'two' }] });
  });

  it('drags the list item whose grip opens the menu, not its whole list', async () => {
    const doc: DocJSON = { type: 'doc', content: [bullets('one', 'two', 'three'), line('after')] };
    const { blocks, editor } = await mountDocument(doc, 1);
    await userEvent.dragAndDrop(await gripBesideItem('three'), blocks[1], { steps: 10 });
    await vi.waitFor(() => expect(itemsOf(editor(), 0)).toEqual(['one', 'two']));
    expect(editor().getText()).toContain('three');
  });

  it('offers no Turn into on a code block, whose code it would flatten', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [line('before'), { type: 'codeBlock', attrs: { language: 'text', code: 'let a = 1;' } }],
    };
    const { handle, editor } = await mountDocument(doc, 1, [codeBlock()]);
    await userEvent.click(handle);
    const menu = page.getByRole('menu', { name: 'Block actions' });
    await expect.element(menu.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    expect(editor().getSelection()).toMatchObject({ isNode: true, from: 8 });
    expect(menu.getByRole('menuitem', { name: 'Turn into' }).elements()).toHaveLength(0);
  });

  it('opens no block menu on Mod-/ inside a code block, whose own keys take it', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [line('before'), { type: 'codeBlock', attrs: { language: 'javascript', code: 'let a = 1;' } }],
    };
    await mountDocument(doc, 0, [codeBlock()]);
    const code = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('.cm-content');
      if (!found) throw new Error('the code view is not mounted');
      return found;
    });
    await userEvent.click(code);
    await userEvent.keyboard('{Control>}/{/Control}');
    // A key typed after it lands in the code, so the shortcut has been handled by the time it shows.
    await userEvent.keyboard('x');
    await vi.waitFor(() => expect(code.textContent).toContain('x'));
    expect(page.getByRole('menu').elements()).toHaveLength(0);
  });

  it('moves the block and opens no menu when the grip is pressed and dragged past the next block', async () => {
    const { handle, blocks, texts } = await mountBlocks(['first', 'second', 'third'], 0);
    // One jump from the grip to the target starts no drag; the browser needs the pointer to travel.
    await userEvent.dragAndDrop(handle, blocks[2], { steps: 10 });
    await vi.waitFor(() => expect(texts()).toEqual(['second', 'third', 'first']));
    expect(page.getByRole('menu').elements()).toHaveLength(0);
  });

  it('renders items sharing a group as radios, checks the active one and disables one that names a reason', async () => {
    const aligns = defineFeature({
      id: 'aligns',
      blockMenu: [
        { id: 'left', title: 'Left', group: 'Align', command: 'focus', active: () => true },
        {
          id: 'right',
          title: 'Right',
          group: 'Align',
          command: 'focus',
          disabledReason: () => 'Locked by the template',
        },
      ],
    });
    const { handle } = await mountBlocks(['first'], 0, [aligns]);
    await userEvent.click(handle);
    await userEvent.click(page.getByRole('menuitem', { name: 'Align' }));
    await expect.element(page.getByRole('menuitemradio', { name: 'Left' })).toBeChecked();
    await expect.element(page.getByRole('menuitemradio', { name: 'Right' })).toBeDisabled();
    await userEvent.hover(page.getByRole('menuitemradio', { name: 'Right' }), { force: true });
    await expect.element(page.getByText('Locked by the template')).toBeVisible();
  });
});

// The columns block, whose columns hold their own blocks.
const columns = columnsFeature({ columnContent: 'paragraph+' });
const twoLanes = (left: string[], right: string[]) => ({
  type: 'columns',
  attrs: { ratio: [1, 1] },
  content: [left, right].map((texts) => ({ type: 'column', content: texts.map(line) })),
});
const lanesOf = (editor: IEditor) =>
  (editor.getJSON().content?.[0]?.content ?? []).map((lane) =>
    (lane.content ?? []).map((block) => block.content?.[0]?.text),
  );
const cellsOf = (editor: IEditor) =>
  (editor.getJSON().content?.[0]?.content?.[0]?.content ?? []).map((cell) =>
    (cell.content ?? []).map((block) => block.content?.[0]?.text),
  );

describe('the block a grip addresses inside another block', () => {
  // Wide enough that a lane holds the point the grip looks at, right of the pointer.
  beforeAll(async () => {
    await page.viewport(1200, 800);
  });

  const laneDoc: DocJSON = { type: 'doc', content: [twoLanes(['l1', 'l2'], ['r1', 'r2']), line('after')] };

  it('duplicates a later block of a lane inside that lane, the lanes left as they are', async () => {
    const { editor } = await mountDocument(laneDoc, 1, [columns]);
    await userEvent.click(await gripBeside(holding('.ProseMirror p', 'r2')));
    await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() =>
      expect(lanesOf(editor())).toEqual([
        ['l1', 'l2'],
        ['r1', 'r2', 'r2'],
      ]),
    );
  });

  it('drags a later block of a lane out of it, the lane kept, as its menu would act on it', async () => {
    const { blocks, editor } = await mountDocument(laneDoc, 1, [columns]);
    await userEvent.dragAndDrop(await gripBeside(holding('.ProseMirror p', 'l2')), blocks[1], { steps: 10 });
    await vi.waitFor(() => expect(lanesOf(editor())).toEqual([['l1'], ['r1', 'r2']]));
    expect(
      editor()
        .getJSON()
        .content?.slice(1)
        .map((block) => block.content?.[0]?.text),
    ).toContain('l2');
  });

  it('acts on the whole columns block from the grip beside its first line', async () => {
    const { editor } = await mountDocument(laneDoc, 1, [columns]);
    await userEvent.click(await gripBeside(holding('.ProseMirror p', 'l1')));
    await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() => expect(types(editor())).toEqual(['columns', 'columns', 'paragraph']));
  });

  it("opens the menu with Mod-/ on a lane's first block holding the caret, not on its columns block", async () => {
    const { editor } = await mountDocument(laneDoc, 1, [columns]);
    await userEvent.click(holding('.ProseMirror p', 'r1'));
    await userEvent.keyboard('{Control>}/{/Control}');
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(lanesOf(editor())).toEqual([['l1', 'l2'], ['r2']]));
  });

  it('drags the whole columns block from the grip beside its first line', async () => {
    const { blocks, editor } = await mountDocument(laneDoc, 1, [columns]);
    await userEvent.dragAndDrop(await gripBeside(holding('.ProseMirror p', 'l1')), blocks[1], { steps: 10 });
    await vi.waitFor(() => expect(types(editor())).toEqual(['paragraph', 'columns', 'paragraph']));
    // Each line now carries the block layout's attributes, each null; the shape is what moved.
    expect(editor().getJSON().content?.[1]).toMatchObject(twoLanes(['l1', 'l2'], ['r1', 'r2']));
  });

  const tableDoc: DocJSON = {
    type: 'doc',
    content: [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [line('c1'), line('c2')] },
              { type: 'tableCell', content: [line('d1')] },
            ],
          },
        ],
      },
      line('after'),
    ],
  };

  it('deletes only the later paragraph of a table cell whose grip opened the menu', async () => {
    const { editor } = await mountDocument(tableDoc, 1, [table()]);
    await userEvent.click(await gripBeside(holding('.ProseMirror td p', 'c2')));
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(cellsOf(editor())).toEqual([['c1'], ['d1']]));
  });

  it('duplicates the later paragraph of a table cell inside that cell, adding no cell', async () => {
    const { editor } = await mountDocument(tableDoc, 1, [table()]);
    await userEvent.click(await gripBeside(holding('.ProseMirror td p', 'c2')));
    await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() => expect(cellsOf(editor())).toEqual([['c1', 'c2', 'c2'], ['d1']]));
  });

  it('drags the whole table from the grip beside its first line', async () => {
    const { blocks, editor } = await mountDocument(tableDoc, 1, [table()]);
    const grip = await gripBeside(holding('.ProseMirror td p', 'c1'), blocks[0]);
    await userEvent.dragAndDrop(grip, blocks[1], { steps: 10 });
    // The editor keeps a paragraph below a last block that is not one.
    await vi.waitFor(() => expect(types(editor())).toEqual(['paragraph', 'table', 'paragraph']));
    expect(editor().getJSON().content?.[1]).toMatchObject({
      content: [{ content: [{ content: [line('c1'), line('c2')] }, { content: [line('d1')] }] }],
    });
  });

  /** Opens the block menu from the grip beside the first line of the table, which the handle stands beside. */
  async function tableMenu(blocks: HTMLElement[]) {
    await userEvent.click(await gripBeside(holding('.ProseMirror td p', 'c1'), blocks[0]));
    await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();
  }

  it('deletes the whole table from its grip menu, and Mod-Z brings it back', async () => {
    const { blocks, editor } = await mountDocument(tableDoc, 1, [table()]);
    const loaded = editor().getJSON();
    await tableMenu(blocks);
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(types(editor())).toEqual(['paragraph']));
    await vi.waitFor(() => expect(document.activeElement?.classList.contains('ProseMirror')).toBe(true));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(editor().getJSON()).toEqual(loaded));
  });

  it('duplicates the whole table from its grip menu into two equal tables', async () => {
    const { blocks, editor } = await mountDocument(tableDoc, 1, [table()]);
    const loaded = editor().getJSON().content?.[0];
    await tableMenu(blocks);
    await userEvent.click(page.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() => expect(types(editor())).toEqual(['table', 'table', 'paragraph']));
    expect(editor().getJSON().content?.[1]).toEqual(loaded);
  });

  it('deletes only the quote inside a quote whose grip opened the menu', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        { type: 'blockquote', content: [line('outer'), { type: 'blockquote', content: [line('inner')] }] },
        line('after'),
      ],
    };
    const { editor } = await mountDocument(doc, 1);
    await userEvent.click(await gripBeside(holding('.ProseMirror blockquote blockquote', 'inner')));
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() =>
      expect(editor().getJSON().content?.[0]).toMatchObject({ type: 'blockquote', content: [line('outer')] }),
    );
    expect(types(editor())).toEqual(['blockquote', 'paragraph']);
  });

  const quoteInItem: DocJSON = {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [line('one'), { type: 'blockquote', content: [line('quoted')] }] },
          { type: 'listItem', content: [line('two')] },
        ],
      },
      line('after'),
    ],
  };
  const quotesIn = (editor: IEditor) => JSON.stringify(editor.getJSON().content?.[0]).includes('blockquote');

  it('deletes only the quote inside a list item whose grip opened the menu', async () => {
    const { editor } = await mountDocument(quoteInItem, 1);
    await userEvent.click(await gripBeside(holding('.ProseMirror li blockquote', 'quoted')));
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(quotesIn(editor())).toBe(false));
    expect(itemsOf(editor(), 0)).toEqual(['one', 'two']);
  });

  it('drags only the quote inside a list item out of it, the list kept', async () => {
    const { blocks, editor } = await mountDocument(quoteInItem, 1);
    const grip = await gripBeside(holding('.ProseMirror li blockquote', 'quoted'));
    await userEvent.dragAndDrop(grip, blocks[1], { steps: 10 });
    await vi.waitFor(() => expect(types(editor())).toEqual(['bulletList', 'paragraph', 'blockquote', 'paragraph']));
    expect(itemsOf(editor(), 0)).toEqual(['one', 'two']);
    expect(quotesIn(editor())).toBe(false);
  });

  it('opens the menu with Mod-/ on the list item holding the caret, not its whole list', async () => {
    const doc: DocJSON = { type: 'doc', content: [bullets('one', 'two', 'three'), line('after')] };
    const { editor } = await mountDocument(doc, 1);
    await userEvent.click(holding('.ProseMirror li p', 'two'));
    await userEvent.keyboard('{Control>}/{/Control}');
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(itemsOf(editor(), 0)).toEqual(['one', 'three']));
  });

  it("leaves the list item's own list type out of Turn into", async () => {
    const doc: DocJSON = { type: 'doc', content: [bullets('one', 'two'), line('after')] };
    await mountDocument(doc, 1);
    await userEvent.click(await gripBesideItem('two'));
    await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
    await expect.element(page.getByRole('menuitemradio', { name: 'Numbered list' })).toBeVisible();
    expect(page.getByRole('menuitemradio', { name: 'Bulleted list' }).elements()).toHaveLength(0);
  });
});
