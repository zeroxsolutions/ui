import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  DocJSON,
  EditorSelection,
  IEditor,
  TriggerQuery,
} from '../document/core/index.js';
import type { ChatCommand } from './composer-types.js';
import { CommandMenu } from './command-menu.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** A single-paragraph composer doc with the given leading text. */
const docWithText = (text: string): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
});

/** A single-paragraph composer doc whose leading inline node is a committed
 *  command pill (what makes the menu start-only and the line one-command). */
const docWithCommand = (name: string): DocJSON => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'command', attrs: { id: name, label: name, name } }],
    },
  ],
});

function fakeEditor({
  run = vi.fn(() => true),
  trigger = null,
  json = docWithText('/im'),
  selection = { from: 1, to: 1, empty: true },
}: {
  run?: ReturnType<typeof vi.fn>;
  trigger?: TriggerQuery | null;
  json?: DocJSON;
  selection?: EditorSelection;
} = {}): IEditor {
  return {
    status: 'ready',
    run,
    isEditable: () => true,
    isFocused: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    caretRect: () => ({ top: 10, bottom: 30, left: 20, right: 80 }),
    triggerQuery: () => trigger,
    getJSON: () => json,
    getSelection: () => selection,
    setSlashDecoration: () => {},
    focus: () => {},
  } as unknown as IEditor;
}

const commands: ChatCommand[] = [
  { id: 'image', name: 'image-gen', label: 'Image' },
  { id: 'video', name: 'video', label: 'Video' },
];

describe('CommandMenu', () => {
  it('opens at the input start and filters by the typed `/query`', () => {
    const editor = fakeEditor({ trigger: { query: 'im', from: 1, to: 3 } });
    const { container, getByText, queryByText } = render(
      <CommandMenu editor={editor} commands={commands} />,
    );
    expect(container.querySelector('[data-command-menu]')).not.toBeNull();
    expect(getByText('Image')).toBeDefined();
    expect(queryByText('Video')).toBeNull();
  });

  it('inserts the inline `/name` command node on select — deletes the `/query`', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({ run, trigger: { query: 'im', from: 1, to: 3 } });
    const { getByText } = render(
      <CommandMenu editor={editor} commands={commands} />,
    );
    fireEvent.mouseDown(getByText('Image'));
    fireEvent.click(getByText('Image'));
    expect(run).toHaveBeenCalledWith('deleteRange', { from: 1, to: 3 });
    expect(run).toHaveBeenCalledWith('insertCommand', {
      id: 'image',
      label: 'Image',
      name: 'image-gen',
    });
  });

  it('stays closed for a `/` typed mid-argument (not at the input start)', () => {
    const editor = fakeEditor({
      trigger: { query: 'im', from: 7, to: 9 },
      json: docWithText('hello /im'),
    });
    const { container } = render(
      <CommandMenu editor={editor} commands={commands} />,
    );
    expect(container.querySelector('[data-command-menu]')).toBeNull();
  });

  it('stays closed once a command already leads the line (one command max)', () => {
    const editor = fakeEditor({
      trigger: { query: 'im', from: 1, to: 3 },
      json: docWithCommand('image-gen'),
    });
    const { container } = render(
      <CommandMenu editor={editor} commands={commands} />,
    );
    expect(container.querySelector('[data-command-menu]')).toBeNull();
  });

  it('auto-commits on Space when the query is an exact slug match', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      trigger: { query: 'image-gen', from: 1, to: 11 },
      json: docWithText('/image-gen'),
    });
    render(<CommandMenu editor={editor} commands={commands} />);
    fireEvent.keyDown(document, { key: ' ' });
    expect(run).toHaveBeenCalledWith('insertCommand', {
      id: 'image',
      label: 'Image',
      name: 'image-gen',
    });
  });

  it('does not auto-commit on Space for a partial query (Space stays literal)', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      trigger: { query: 'im', from: 1, to: 3 },
      json: docWithText('/im'),
    });
    render(<CommandMenu editor={editor} commands={commands} />);
    fireEvent.keyDown(document, { key: ' ' });
    expect(run).not.toHaveBeenCalledWith('insertCommand', expect.anything());
  });

  it('restores `/name` text on Backspace on the committed pill', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      json: docWithCommand('image-gen'),
      selection: { from: 2, to: 2, empty: true },
    });
    render(<CommandMenu editor={editor} commands={commands} />);
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(run).toHaveBeenCalledWith('deleteRange', { from: 1, to: 2 });
    expect(run).toHaveBeenCalledWith('insertContent', {
      content: { type: 'text', text: '/image-gen' },
    });
  });

  it('does not restore on Backspace when the caret is not on the pill', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      json: docWithCommand('image-gen'),
      selection: { from: 5, to: 5, empty: true },
    });
    render(<CommandMenu editor={editor} commands={commands} />);
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(run).not.toHaveBeenCalledWith('deleteRange', expect.anything());
  });
});
