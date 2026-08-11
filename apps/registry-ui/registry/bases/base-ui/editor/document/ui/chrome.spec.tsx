import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  EditorSelection,
  IEditor,
  TriggerQuery,
} from '@zeroxsolutions/editor-core/document/core/index';
import { standardKit, callout } from '../features/index.js';
import { BubbleMenu } from './bubble-menu.js';
import { EditorToolbar } from './editor-toolbar.js';
import { SlashMenu } from './slash-menu.js';
import {
  collectUiContributions,
  defaultBlockMenuItems,
  filterSlashItems,
  groupByHeading,
} from '@zeroxsolutions/editor-core/document/ui/collect-ui-contributions';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function fakeEditor(
  run = vi.fn(() => true),
  selection: EditorSelection = { from: 0, to: 0, empty: true },
  trigger: TriggerQuery | null = null,
  setSlashDecoration: (
    deco: { from: number; to: number; ghost?: string } | null,
  ) => void = () => {},
): IEditor {
  return {
    status: 'ready',
    isActive: (name: string) => name === 'bold',
    run,
    can: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    onSnapshot: () => () => {},
    isEditable: () => true,
    isFocused: () => true,
    getSelection: () => selection,
    caretRect: () => ({ top: 10, bottom: 30, left: 20, right: 80 }),
    triggerQuery: () => trigger,
    setSlashDecoration,
    focus: () => {},
    blur: () => {},
  } as unknown as IEditor;
}

/** Stub the browser Selection the bubble menu reads for its rect + containment. */
function stubDomSelection(collapsed: boolean): void {
  vi.spyOn(window, 'getSelection').mockReturnValue({
    isCollapsed: collapsed,
    rangeCount: collapsed ? 0 : 1,
    getRangeAt: () => ({
      getBoundingClientRect: () => ({
        top: 10,
        left: 20,
        bottom: 30,
        right: 80,
      }),
      commonAncestorContainer: document.body,
    }),
  } as unknown as Selection);
}

describe('collectUiContributions', () => {
  it('merges slash/toolbar/bubble items across features', () => {
    const contributions = collectUiContributions([standardKit(), callout()]);
    expect(contributions.toolbar.some((item) => item.id === 'bold')).toBe(true);
    expect(contributions.slash.some((item) => item.id === 'callout')).toBe(
      true,
    );
    expect(contributions.slash.some((item) => item.id === 'h1')).toBe(true);
  });
});

describe('filterSlashItems', () => {
  const items = collectUiContributions([standardKit(), callout()]).slash;
  it('matches on title and keywords', () => {
    expect(
      filterSlashItems(items, 'call').some((i) => i.id === 'callout'),
    ).toBe(true);
    expect(
      filterSlashItems(items, 'todo').some((i) => i.id === 'taskList'),
    ).toBe(true);
  });
  it('returns everything for an empty query', () => {
    expect(filterSlashItems(items, '  ')).toHaveLength(items.length);
  });
});

describe('groupByHeading', () => {
  it('groups items under their heading, preserving order', () => {
    const groups = groupByHeading([
      { id: 'a', group: 'X' },
      { id: 'b', group: 'Y' },
      { id: 'c', group: 'X' },
    ] as Array<{ id: string; group?: string }>);
    expect(groups.map(([heading]) => heading)).toEqual(['X', 'Y']);
    expect(groups[0][1]).toHaveLength(2);
  });
});

describe('defaultBlockMenuItems', () => {
  it('offers turn-into and a separated delete', () => {
    expect(
      defaultBlockMenuItems.some((i) => i.command === 'toggleHeading'),
    ).toBe(true);
    const del = defaultBlockMenuItems.find((i) => i.id === 'delete');
    expect(del?.separatorBefore).toBe(true);
  });
});

describe('EditorToolbar', () => {
  const items = collectUiContributions([standardKit()]).toolbar;

  it('renders a design-system Toggle + Tooltip per toolbar item', () => {
    const { getByLabelText, container } = render(
      <EditorToolbar editor={fakeEditor()} items={items} />,
    );
    expect(getByLabelText('Bold')).toBeDefined();
    expect(getByLabelText('Italic')).toBeDefined();
    // Buttons are composed as design-system Tooltip triggers (not a raw `title`).
    expect(
      container.querySelector('[data-slot="tooltip-trigger"]'),
    ).not.toBeNull();
  });

  it('dispatches the item command through the façade on click', () => {
    const run = vi.fn(() => true);
    const { getByLabelText } = render(
      <EditorToolbar editor={fakeEditor(run)} items={items} />,
    );
    fireEvent.click(getByLabelText('Bold'));
    expect(run).toHaveBeenCalledWith('toggleMark', { name: 'bold' });
  });

  it('reflects active state as aria-pressed', () => {
    const { getByLabelText } = render(
      <EditorToolbar editor={fakeEditor()} items={items} />,
    );
    expect(getByLabelText('Bold').getAttribute('aria-pressed')).toBe('true');
    expect(getByLabelText('Italic').getAttribute('aria-pressed')).toBe('false');
  });
});

describe('BubbleMenu', () => {
  const items = collectUiContributions([standardKit()]).bubble;

  it('shows over a non-empty text selection', () => {
    stubDomSelection(false);
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 5, empty: false, isNode: false },
    );
    render(<BubbleMenu editor={editor} items={items} />);
    // The popover portals to document.body, so the assertion must query there.
    expect(
      document.body.querySelector('[data-slot="bubble-menu"]'),
    ).not.toBeNull();
  });

  it('stays hidden for a whole-node selection (a block picked up by the drag handle / a selected image)', () => {
    stubDomSelection(false);
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 5, empty: false, isNode: true },
    );
    render(<BubbleMenu editor={editor} items={items} />);
    expect(document.body.querySelector('[data-slot="bubble-menu"]')).toBeNull();
  });

  it('stays hidden when the selection is collapsed (a caret)', () => {
    stubDomSelection(true);
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 3, to: 3, empty: true, isNode: false },
    );
    render(<BubbleMenu editor={editor} items={items} />);
    expect(document.body.querySelector('[data-slot="bubble-menu"]')).toBeNull();
  });
});

describe('SlashMenu', () => {
  const items = collectUiContributions([standardKit()]).slash;

  it('opens inline at the caret and filters by the typed `/query`', () => {
    // `/head` typed → only the heading items survive the filter.
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 1, empty: true },
      {
        query: 'head',
        from: 0,
        to: 1,
      },
    );
    const { getByText, queryByText } = render(
      <SlashMenu editor={editor} items={items} />,
    );
    // The popover portals to document.body, so the assertion must query there.
    expect(
      document.body.querySelector('[data-slot="slash-menu"]'),
    ).not.toBeNull();
    // Rows compose the design-system `Item` (not a hand-rolled `<button>` list).
    expect(document.body.querySelector('[data-slot="item"]')).not.toBeNull();
    expect(getByText('Heading 1')).toBeDefined();
    expect(queryByText('Quote')).toBeNull();
  });

  it('renders the design-system `Empty` state when nothing matches', () => {
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 12, to: 12, empty: true },
      {
        query: 'zzznomatch',
        from: 1,
        to: 12,
      },
    );
    const { getByText } = render(<SlashMenu editor={editor} items={items} />);
    expect(document.body.querySelector('[data-slot="empty"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="item"]')).toBeNull();
    expect(getByText('No matching blocks')).toBeDefined();
  });

  it('stays closed when there is no `/` trigger', () => {
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 1, empty: true },
      null,
    );
    render(<SlashMenu editor={editor} items={items} />);
    expect(document.body.querySelector('[data-slot="slash-menu"]')).toBeNull();
  });

  it('sets the inline placeholder ghost after `/` on an empty query', () => {
    const setDeco = vi.fn();
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 1, empty: true },
      { query: '', from: 0, to: 1 },
      setDeco,
    );
    render(<SlashMenu editor={editor} items={items} />);
    expect(setDeco).toHaveBeenCalledWith({
      from: 0,
      to: 1,
      ghost: 'Type to search',
    });
  });

  it('paints the `/query` highlight + the highlighted item autocomplete ghost', () => {
    const setDeco = vi.fn();
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 5, to: 5, empty: true },
      { query: 'head', from: 1, to: 5 },
      setDeco,
    );
    render(<SlashMenu editor={editor} items={items} />);
    // `/head` → top match "Heading 1" → the ghost completes it inline.
    expect(setDeco).toHaveBeenCalledWith({ from: 1, to: 5, ghost: 'ing 1' });
  });

  it('deletes the typed `/query` range, then runs the item command on select', () => {
    const run = vi.fn(() => true);
    // `/quote` spanning positions 1..6.
    const editor = fakeEditor(
      run,
      { from: 6, to: 6, empty: true },
      {
        query: 'quote',
        from: 1,
        to: 6,
      },
    );
    const { getByText } = render(<SlashMenu editor={editor} items={items} />);
    fireEvent.mouseDown(getByText('Quote'));
    fireEvent.click(getByText('Quote'));
    expect(run).toHaveBeenCalledWith('deleteRange', { from: 1, to: 6 });
    expect(run).toHaveBeenCalledWith('toggleBlockquote', undefined);
  });
});
