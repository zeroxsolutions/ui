import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  DocJSON,
  EditorSelection,
  IEditor,
  TriggerQuery,
} from '@zeroxsolutions/editor-core/document/core/index';
import { TriggerMenu } from './trigger-menu.js';
import { commandTrigger } from '../composer-triggers';
import {
  invocationToken,
  referenceToken,
  type TriggerOption,
} from '@zeroxsolutions/editor-core/composer/triggers/trigger-token';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const docWithText = (text: string): DocJSON => ({
  type: 'doc',
  content: [
    { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] },
  ],
});

/** A doc whose leading inline node is a committed command pill (the uniform
 *  `{ id, label, slug }` the inline-token factory stores). */
const docWithCommand = (slug: string): DocJSON => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'command', attrs: { id: slug, label: slug, slug } }],
    },
  ],
});

function fakeEditor({
  run = vi.fn(() => true),
  trigger = null,
  json = docWithText('/im'),
  selection = { from: 1, to: 1, empty: true },
  setSlashDecoration = vi.fn(),
}: {
  run?: ReturnType<typeof vi.fn>;
  trigger?: TriggerQuery | null;
  json?: DocJSON;
  selection?: EditorSelection;
  setSlashDecoration?: ReturnType<typeof vi.fn>;
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
    setSlashDecoration,
    focus: () => {},
  } as unknown as IEditor;
}

const options: TriggerOption[] = [
  { id: 'image', slug: 'image-gen', label: 'Image' },
  { id: 'video', slug: 'video', label: 'Video' },
];

const command = invocationToken('command', '/', {
  nodeName: 'command',
  source: () => options,
  insert: (editor, option) => {
    editor.run('commit', option);
  },
  readRef: (attrs) => ({
    slug: String(attrs.slug ?? ''),
    id: String(attrs.id ?? ''),
  }),
});

const people: TriggerOption[] = [
  { id: 'alice', label: 'Alice' },
  { id: 'bob', label: 'Bob' },
];
const mention = referenceToken('mention', '@', {
  nodeName: 'mention',
  source: () => people,
  insert: (editor, option) => {
    editor.run('commit', option);
  },
  readRef: (attrs) => ({ id: String(attrs.id ?? '') }),
});

describe('TriggerMenu - opening + gate', () => {
  it('an invocation opens at the input start and filters by the query', () => {
    const editor = fakeEditor({ trigger: { query: 'im', from: 1, to: 3 } });
    const { getByText, queryByText } = render(
      <TriggerMenu editor={editor} token={command} />,
    );
    // The popover portals to document.body, so the assertion must query there.
    expect(
      document.body.querySelector('[data-slot="trigger-menu"]'),
    ).not.toBeNull();
    expect(getByText('Image')).toBeDefined();
    expect(queryByText('Video')).toBeNull();
  });

  it('an invocation stays closed for a `/` typed mid-line', () => {
    const editor = fakeEditor({
      trigger: { query: 'im', from: 7, to: 9 },
      json: docWithText('hello /im'),
    });
    render(<TriggerMenu editor={editor} token={command} />);
    expect(
      document.body.querySelector('[data-slot="trigger-menu"]'),
    ).toBeNull();
  });

  it('an invocation stays closed once a command already leads the line', () => {
    const editor = fakeEditor({
      trigger: { query: 'im', from: 1, to: 3 },
      json: docWithCommand('image-gen'),
    });
    render(<TriggerMenu editor={editor} token={command} />);
    expect(
      document.body.querySelector('[data-slot="trigger-menu"]'),
    ).toBeNull();
  });

  it('a reference opens mid-line (gate: anywhere)', () => {
    const editor = fakeEditor({
      trigger: { query: 'al', from: 4, to: 6 },
      json: docWithText('hi @al'),
    });
    const { getByText } = render(
      <TriggerMenu editor={editor} token={mention} />,
    );
    expect(
      document.body.querySelector('[data-slot="trigger-menu"]'),
    ).not.toBeNull();
    expect(getByText('Alice')).toBeDefined();
  });
});

describe('TriggerMenu - commit', () => {
  it('select deletes the typed query then commits the token', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      trigger: { query: 'im', from: 1, to: 3 },
    });
    const { getByText } = render(
      <TriggerMenu editor={editor} token={command} />,
    );
    fireEvent.mouseDown(getByText('Image'));
    fireEvent.click(getByText('Image'));
    expect(run).toHaveBeenCalledWith('deleteRange', { from: 1, to: 3 });
    expect(run).toHaveBeenCalledWith('commit', options[0]);
  });

  it('an invocation auto-commits on Space for an exact slug match', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      trigger: { query: 'image-gen', from: 1, to: 11 },
      json: docWithText('/image-gen'),
    });
    render(<TriggerMenu editor={editor} token={command} />);
    fireEvent.keyDown(document, { key: ' ' });
    expect(run).toHaveBeenCalledWith('commit', options[0]);
  });

  it('an invocation does not auto-commit on Space for a partial query', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      trigger: { query: 'im', from: 1, to: 3 },
    });
    render(<TriggerMenu editor={editor} token={command} />);
    fireEvent.keyDown(document, { key: ' ' });
    expect(run).not.toHaveBeenCalledWith('commit', expect.anything());
  });

  it('a reference never commits on Space, even on an exact match', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      trigger: { query: 'alice', from: 1, to: 6 },
      json: docWithText('@alice'),
    });
    render(<TriggerMenu editor={editor} token={mention} />);
    fireEvent.keyDown(document, { key: ' ' });
    expect(run).not.toHaveBeenCalledWith('commit', expect.anything());
  });
});

describe('TriggerMenu - backspace restore (invocation)', () => {
  it('restores `char slug` text on Backspace on the committed pill', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      json: docWithCommand('image-gen'),
      selection: { from: 2, to: 2, empty: true },
    });
    render(<TriggerMenu editor={editor} token={command} />);
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(run).toHaveBeenCalledWith('deleteRange', { from: 1, to: 2 });
    expect(run).toHaveBeenCalledWith('insertContent', {
      content: { type: 'text', text: '/image-gen' },
    });
  });

  it('does not restore when the caret is not on the pill', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      json: docWithCommand('image-gen'),
      selection: { from: 5, to: 5, empty: true },
    });
    render(<TriggerMenu editor={editor} token={command} />);
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(run).not.toHaveBeenCalledWith('deleteRange', expect.anything());
  });

  it('restores the slug (not the id) for a shipped command where name != id', () => {
    // The shipped commandTrigger.readRef renames slug -> name, so restore must
    // read the raw node attrs, not the ref. `/image-gen` (id 'image') must
    // restore to `/image-gen`, never `/image`.
    const run = vi.fn(() => true);
    const token = commandTrigger([
      { id: 'image', name: 'image-gen', label: 'Image' },
    ]).token;
    const editor = fakeEditor({
      run,
      json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'command',
                attrs: { id: 'image', label: 'Image', slug: 'image-gen' },
              },
            ],
          },
        ],
      },
      selection: { from: 2, to: 2, empty: true },
    });
    render(<TriggerMenu editor={editor} token={token} />);
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(run).toHaveBeenCalledWith('insertContent', {
      content: { type: 'text', text: '/image-gen' },
    });
  });

  it('a reference has no backspace-restore', () => {
    const run = vi.fn(() => true);
    const editor = fakeEditor({
      run,
      json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'mention', attrs: { id: 'alice' } }],
          },
        ],
      },
      selection: { from: 2, to: 2, empty: true },
    });
    render(<TriggerMenu editor={editor} token={mention} />);
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(run).not.toHaveBeenCalledWith('deleteRange', expect.anything());
  });
});

describe('TriggerMenu - non-interfering highlight', () => {
  it('an inactive menu never clears the shared decoration slot', () => {
    const setSlashDecoration = vi.fn();
    const editor = fakeEditor({ trigger: null, setSlashDecoration });
    render(<TriggerMenu editor={editor} token={command} />);
    // It never painted, so it must never clear (which would wipe a sibling).
    expect(setSlashDecoration).not.toHaveBeenCalled();
  });
});
