import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { referenceToken, type TriggerOption } from '@zeroxsolutions/editor-core/composer/index';
import type { ChatCommand, ChatPerson } from '@zeroxsolutions/editor-core/composer/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { ChatInput } from '../chat-input';
import { commandTrigger, mentionTrigger } from '../composer-triggers';

import { TriggerMenu } from './trigger-menu';

const commands: ChatCommand[] = [
  { id: 'image', name: 'image-gen', label: 'Image' },
  { id: 'video', name: 'video', label: 'Video' },
];
const people: ChatPerson[] = [
  { id: 'alice', label: 'Alice' },
  { id: 'bob', label: 'Bob' },
];

/** Mounts the composer on the shipped `/` and `@` triggers and puts the caret in it. */
async function mountComposer(): Promise<IEditor> {
  let ready: IEditor | null = null;
  const triggers = [mentionTrigger({ people }), commandTrigger(commands)];
  await render(
    <div className="style-nova p-8">
      <ChatInput triggers={triggers} onSubmit={() => {}} onReady={(editor) => (ready = editor)} />
    </div>,
  );
  const editor = await vi.waitFor(() => {
    if (ready === null) throw new Error('the composer is not ready');
    return ready;
  });
  await userEvent.click(page.getByTestId('input-group-control'));
  return editor;
}

const menu = page.getByTestId('trigger-menu');

/** The inline nodes of the composer's one line. */
const inline = (editor: IEditor): NodeJSON[] => editor.getJSON().content?.[0]?.content ?? [];
const tokens = (editor: IEditor, type: string) => inline(editor).filter((node) => node.type === type);

describe('TriggerMenu, opening', () => {
  it('opens a command menu at the start of the input, filtered by what is typed', async () => {
    await mountComposer();
    await userEvent.keyboard('/im');

    await expect.element(menu.getByText('Image')).toBeVisible();
    await expect.element(menu.getByText('Video')).not.toBeInTheDocument();
  });

  it('opens no command menu for a `/` typed mid-line', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('hello /im');

    await vi.waitFor(() => expect(editor.getText()).toBe('hello /im'));
    await expect.element(menu).not.toBeInTheDocument();
  });

  it('opens a mention menu mid-line', async () => {
    await mountComposer();
    await userEvent.keyboard('hi @al');

    await expect.element(menu.getByText('Alice')).toBeVisible();
  });
});

describe('TriggerMenu, committing', () => {
  it('takes the typed query out and commits the picked command', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('/im');
    await userEvent.click(menu.getByText('Image'));

    await vi.waitFor(() => expect(tokens(editor, 'command')).toHaveLength(1));
    expect(tokens(editor, 'command')[0]?.attrs).toMatchObject({ id: 'image', slug: 'image-gen' });
    expect(editor.getText()).not.toContain('/im');
  });

  it('commits a command on Space when the query is its exact name', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('/image-gen ');

    await vi.waitFor(() => expect(tokens(editor, 'command')[0]?.attrs).toMatchObject({ id: 'image' }));
  });

  it('types a Space for a query that only starts a command name', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('/im x');

    await vi.waitFor(() => expect(editor.getText()).toBe('/im x'));
    expect(tokens(editor, 'command')).toHaveLength(0);
  });

  it('never commits a mention on Space, even on an exact name', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('@alice x');

    await vi.waitFor(() => expect(editor.getText()).toBe('@alice x'));
    expect(tokens(editor, 'mention')).toHaveLength(0);
  });
});

describe('TriggerMenu, Backspace on a committed command', () => {
  it('turns the command back into its `/name` text, the name and not the id', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('/image-gen ');
    await vi.waitFor(() => expect(tokens(editor, 'command')).toHaveLength(1));
    await userEvent.keyboard('{Home}{ArrowRight}');

    await userEvent.keyboard('{Backspace}');

    await vi.waitFor(() => expect(tokens(editor, 'command')).toHaveLength(0));
    expect(editor.getText()).toContain('/image-gen');
  });

  it('keeps the command when the caret is not on it', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('/image-gen ');
    await vi.waitFor(() => expect(tokens(editor, 'command')).toHaveLength(1));
    await userEvent.keyboard('cat');

    await userEvent.keyboard('{Backspace}');

    await vi.waitFor(() => expect(editor.getText()).toMatch(/ca$/));
    expect(tokens(editor, 'command')).toHaveLength(1);
  });

  it('deletes a committed mention whole, with no text put back', async () => {
    const editor = await mountComposer();
    await userEvent.keyboard('@al');
    await userEvent.click(menu.getByText('Alice'));
    await vi.waitFor(() => expect(tokens(editor, 'mention')).toHaveLength(1));
    await userEvent.keyboard('{End}{Backspace}');

    await vi.waitFor(() => expect(tokens(editor, 'mention')).toHaveLength(0));
    expect(editor.getText()).not.toContain('Alice');
  });
});

type Caret = { top: number; bottom: number; left: number; right: number };

/**
 * An editor with the caret after a bare `@`, so the menu opens on every option. `caretRect` answers each read
 * in turn and then keeps its last answer; the menu ignores what its other calls return.
 */
function mentionEditor(...carets: Caret[]): IEditor {
  let read = 0;
  return {
    status: 'ready',
    run: () => true,
    isEditable: () => true,
    isFocused: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    caretRect: () => carets[Math.min(read++, carets.length - 1)],
    triggerQuery: () => ({ from: 1, to: 2, query: '' }),
    getJSON: () => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '@' }] }] }),
    getSelection: () => ({ from: 2, to: 2, empty: true }),
    setSlashDecoration: () => {},
    focus: () => {},
  } as unknown as IEditor;
}

/** More people than the menu's height holds. */
const crowd: TriggerOption[] = Array.from({ length: 16 }, (_, at) => ({ id: `person-${at}`, label: `Person ${at}` }));

const mention = referenceToken('mention', '@', {
  nodeName: 'mention',
  source: () => crowd,
  insert: () => {},
  readRef: (attrs) => ({ id: String(attrs.id ?? '') }),
});

describe('TriggerMenu with more options than it holds', () => {
  it('keeps its left edge when its list scrolls after the trigger highlight moved the caret', async () => {
    // The first read comes before the highlight around the `@` is painted; every later read after it.
    const editor = mentionEditor(
      { top: 10, bottom: 30, left: 20, right: 80 },
      { top: 10, bottom: 30, left: 24, right: 84 },
    );
    render(<TriggerMenu editor={editor} token={mention} />);
    await expect.element(menu.getByText('Person 0', { exact: true })).toBeVisible();
    await vi.waitFor(() => expect(menu.element().getBoundingClientRect().left).toBeGreaterThan(0));
    const opened = menu.element().getBoundingClientRect().left;
    const viewport = menu.getByTestId('scroll-area-viewport').element();
    const ended = new Promise((done) => viewport.addEventListener('scrollend', done, { once: true }));

    await userEvent.keyboard('{ArrowUp}');
    await ended;

    expect(menu.element().getBoundingClientRect().left).toBe(opened);
  });
});
