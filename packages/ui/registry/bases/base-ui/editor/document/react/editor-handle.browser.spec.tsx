import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
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
import { standardKit } from '../features/standard/index';
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
    if (found.length !== content.content?.length) throw new Error('the editor is not mounted');
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
  await userEvent.click(page.getByRole('menuitemradio', { name: choice }));
}

const types = (editor: IEditor) => (editor.getJSON().content ?? []).map((block) => block.type);

const bullets = (...texts: string[]) => ({
  type: 'bulletList',
  content: texts.map((text) => ({ type: 'listItem', content: [line(text)] })),
});

/** The text of each item of the top-level list at `index`. */
const itemsOf = (editor: IEditor, index: number) =>
  (editor.getJSON().content?.[index]?.content ?? []).map((item) => item.content?.[0]?.content?.[0]?.text);

/** Points at the list item holding `text`, so the handle sits beside that item rather than its list. */
async function gripBesideItem(text: string): Promise<HTMLElement> {
  const item = Array.from(document.querySelectorAll<HTMLElement>('.ProseMirror li')).find(
    (candidate) => candidate.textContent === text,
  );
  if (!item) throw new Error(`no item holds ${text}`);
  await userEvent.hover(item);
  return vi.waitFor(() => {
    const handle = document.querySelector<HTMLElement>('.drag-handle');
    const top = handle?.getBoundingClientRect().top ?? -1;
    const rect = item.getBoundingClientRect();
    if (!handle || handle.classList.contains('hide') || top < rect.top - 12 || top > rect.bottom) {
      throw new Error('the handle is not beside the item');
    }
    return handle;
  });
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
