import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IEditor, TriggerQuery } from '../document/core/index.js';
import type { ChatPerson } from './composer-types.js';
import { MentionMenu } from './mention-menu.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** A minimal `IEditor` stub with a fixed trigger match — the chrome test pattern.
 *  jsdom can't drive a real caret, so the menu is exercised against the seams it
 *  actually reads (`triggerQuery`, `caretRect`, `run`). */
function fakeEditor(
  run = vi.fn(() => true),
  trigger: TriggerQuery | null = null,
): IEditor {
  return {
    status: 'ready',
    run,
    isEditable: () => true,
    isFocused: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    caretRect: () => ({ top: 10, bottom: 30, left: 20, right: 80 }),
    triggerQuery: () => trigger,
    setSlashDecoration: () => {},
    focus: () => {},
  } as unknown as IEditor;
}

const people: ChatPerson[] = [
  { id: 'u1', label: 'Ada' },
  { id: 'u2', label: 'Bob' },
];

describe('MentionMenu', () => {
  it('opens at the caret and filters the people by the typed `@query`', () => {
    const editor = fakeEditor(vi.fn(() => true), { query: 'ad', from: 1, to: 4 });
    const { container, getByText, queryByText } = render(
      <MentionMenu editor={editor} people={people} />,
    );
    expect(container.querySelector('[data-mention-menu]')).not.toBeNull();
    // Rows are the design-system `Item`, not a hand-rolled button list.
    expect(container.querySelector('[data-slot="item"]')).not.toBeNull();
    expect(getByText('Ada')).toBeDefined();
    expect(queryByText('Bob')).toBeNull();
  });

  it('deletes the typed `@query`, then inserts a resolved pill on select', () => {
    const run = vi.fn(() => true);
    // `@ad` spanning positions 1..4.
    const editor = fakeEditor(run, { query: 'ad', from: 1, to: 4 });
    const { getByText } = render(<MentionMenu editor={editor} people={people} />);
    fireEvent.mouseDown(getByText('Ada'));
    fireEvent.click(getByText('Ada'));
    expect(run).toHaveBeenCalledWith('deleteRange', { from: 1, to: 4 });
    expect(run).toHaveBeenCalledWith('insertMention', { id: 'u1', label: 'Ada' });
  });

  it('shows the label as the row text, never the raw id', () => {
    const editor = fakeEditor(vi.fn(() => true), { query: '', from: 1, to: 1 });
    const { getByText, queryByText } = render(
      <MentionMenu editor={editor} people={people} />,
    );
    expect(getByText('Ada')).toBeDefined();
    expect(queryByText('u1')).toBeNull();
  });

  it('renders the design-system Empty state when nothing matches', () => {
    const editor = fakeEditor(vi.fn(() => true), { query: 'zzz', from: 1, to: 4 });
    const { container } = render(<MentionMenu editor={editor} people={people} />);
    expect(container.querySelector('[data-slot="empty"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="item"]')).toBeNull();
  });

  it('stays closed when there is no `@` trigger', () => {
    const editor = fakeEditor(vi.fn(() => true), null);
    const { container } = render(<MentionMenu editor={editor} people={people} />);
    expect(container.querySelector('[data-mention-menu]')).toBeNull();
  });
});
