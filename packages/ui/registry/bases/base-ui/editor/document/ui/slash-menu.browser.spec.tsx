import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';

import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { mountDocumentEditor } from '../../../../../../src/test/document-editor';
import { standardKit } from '../features/standard/index';
import { SlashMenu } from './slash-menu';

/**
 * An editor with the caret after a bare `/`, so the menu opens on every item. `caretRect` answers each read
 * in turn and then keeps its last answer.
 */
function slashEditor(...carets: { top: number; bottom: number; left: number; right: number }[]): IEditor {
  return slashEditorWhere(() => true, ...carets);
}

/** `slashEditor`, whose commands run where `runs` says. */
function slashEditorWhere(
  runs: (command: string) => boolean,
  ...carets: { top: number; bottom: number; left: number; right: number }[]
): IEditor {
  const reads = carets.length > 0 ? carets : [{ top: 10, bottom: 30, left: 20, right: 80 }];
  let read = 0;
  return {
    status: 'ready',
    run: vi.fn(() => true),
    can: runs,
    isEditable: () => true,
    isFocused: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    caretRect: () => reads[Math.min(read++, reads.length - 1)],
    triggerQuery: () => ({ from: 1, to: 2, query: '' }),
    setSlashDecoration: () => {},
    focus: () => {},
  } as unknown as IEditor;
}

/** More items than the menu's height holds. */
const items: SlashItem[] = Array.from({ length: 16 }, (_, at) => ({
  id: `item-${at}`,
  title: `Item ${at}`,
  description: 'A block',
  group: 'Basic',
  command: 'insert',
}));

const popup = page.getByTestId('slash-menu');
const viewport = popup.getByTestId('scroll-area-viewport');
const row = (title: string) => popup.getByTestId('item').filter({ hasText: new RegExp(`^${title}A block$`) });

/** Resolves once the list has finished the scroll the keys started, which the browser reports after answering it. */
function scrollEnded(): Promise<void> {
  return new Promise((ended) => viewport.element().addEventListener('scrollend', () => ended(), { once: true }));
}

describe('SlashMenu with more items than it holds', () => {
  it('scrolls the option the keys move to into view, the list scrolling inside the popup', async () => {
    render(<SlashMenu editor={slashEditor()} items={items} />);
    await expect.element(popup).toBeVisible();
    await expect.element(row('Item 15')).not.toBeInViewport();

    await userEvent.keyboard('{ArrowUp}');

    await expect.element(row('Item 15')).toHaveAttribute('data-highlighted');
    await expect.element(row('Item 15')).toBeInViewport({ ratio: 1 });
  });

  it('keeps the option the keys move to under a cursor that has not moved', async () => {
    // A cursor left where the popup opens, as an earlier spec or the reader's hand leaves it.
    const rest = document.createElement('div');
    rest.style.cssText = 'position:fixed;left:20px;top:200px;width:288px;height:40px;';
    document.body.append(rest);
    await userEvent.hover(rest);
    rest.remove();
    render(<SlashMenu editor={slashEditor()} items={items} />);
    await expect.element(popup).toBeVisible();

    const ended = scrollEnded();
    await userEvent.keyboard('{ArrowUp}');
    await ended;

    await expect.element(row('Item 15')).toHaveAttribute('data-highlighted');
  });

  it('highlights the option the pointer moves onto', async () => {
    render(<SlashMenu editor={slashEditor()} items={items} />);

    await userEvent.hover(popup.getByText('Item 1', { exact: true }));
    await userEvent.hover(popup.getByText('Item 2', { exact: true }));

    await expect.element(row('Item 2')).toHaveAttribute('data-highlighted');
    await expect.element(row('Item 0')).not.toHaveAttribute('data-highlighted');
  });

  it('keeps its left edge when its list scrolls after the trigger highlight moved the caret', async () => {
    // The first read comes before the highlight around the `/` is painted; every later read after it.
    const editor = slashEditor(
      { top: 10, bottom: 30, left: 20, right: 80 },
      { top: 10, bottom: 30, left: 24, right: 84 },
    );
    render(<SlashMenu editor={editor} items={items} />);
    await vi.waitFor(() => expect(popup.element().getBoundingClientRect().left).toBeGreaterThan(0));
    const opened = popup.element().getBoundingClientRect().left;

    const ended = scrollEnded();
    await userEvent.keyboard('{ArrowUp}');
    await ended;

    expect(popup.element().getBoundingClientRect().left).toBe(opened);
  });
});

describe('SlashMenu at a caret where a command cannot run', () => {
  it('leaves out the items of that command', async () => {
    const offered: SlashItem[] = [
      { id: 'heading', title: 'Heading', group: 'Basic', command: 'toggleHeading' },
      { id: 'columns', title: 'Columns', group: 'Basic', command: 'insertColumns' },
    ];
    render(<SlashMenu editor={slashEditorWhere((command) => command !== 'insertColumns')} items={offered} />);

    await expect.element(page.getByText('Heading', { exact: true })).toBeVisible();
    expect(page.getByText('Columns', { exact: true }).elements()).toHaveLength(0);
  });
});

/** Mounts the Document Editor with its slash menu and puts the caret at the end of its one line. */
async function mountWithSlash(): Promise<IEditor> {
  const editor = await mountDocumentEditor([standardKit()], {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }],
  });
  await userEvent.click(page.getByText('Notes'));
  await userEvent.keyboard('{End}');
  return editor;
}

describe('SlashMenu over the Document Editor', () => {
  it('opens at a typed `/` and offers the items its query matches', async () => {
    await mountWithSlash();
    await userEvent.keyboard('{Enter}/head');

    await expect.element(popup.getByText('Heading 1', { exact: true })).toBeVisible();
    await expect.element(popup.getByText('Quote', { exact: true })).not.toBeInTheDocument();
  });

  it('says so when no item matches', async () => {
    await mountWithSlash();
    await userEvent.keyboard('{Enter}/zzznomatch');

    await expect.element(popup.getByText('No matching blocks')).toBeVisible();
  });

  it('stays closed while no `/` is typed', async () => {
    const editor = await mountWithSlash();
    await userEvent.keyboard(' head');

    await vi.waitFor(() => expect(editor.getText()).toBe('Notes head'));
    await expect.element(popup).not.toBeInTheDocument();
  });

  it('shows what to type after a bare `/`, and the rest of the item the query leads to', async () => {
    await mountWithSlash();
    await userEvent.keyboard('{Enter}/');
    await expect.element(page.getByText('Type to search')).toBeVisible();

    await userEvent.keyboard('head');

    await expect.element(page.getByText('ing 1', { exact: true })).toBeVisible();
  });

  it('takes the typed `/query` out and runs the picked item', async () => {
    const editor = await mountWithSlash();
    await userEvent.keyboard('{Enter}/quote');

    await userEvent.click(popup.getByText('Quote', { exact: true }));

    await vi.waitFor(() => expect(editor.getJSON().content?.map((block) => block.type)).toContain('blockquote'));
    expect(editor.getText()).not.toContain('/quote');
  });
});
