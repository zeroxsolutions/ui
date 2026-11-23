import { act, render, fireEvent, cleanup } from '@testing-library/react';
import * as React from 'react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EditorSelection, IEditor, TriggerQuery } from '@zeroxsolutions/editor-core/document/core/index';
import { standardKit, callout } from '../features/index';
import { Heading1Icon } from '@/registry/bases/base-ui/icons/lucide/heading-1-icon';
import { Heading2Icon } from '@/registry/bases/base-ui/icons/lucide/heading-2-icon';
import { EditorBlockMenu } from '../react/editor-block-menu';
import { BubbleMenu } from './bubble-menu';
import { EditorToolbar } from './editor-toolbar';
import { SlashMenu } from './slash-menu';
import {
  collectUiContributions,
  defaultBlockMenuItems,
  filterSlashItems,
  groupByHeading,
} from '@zeroxsolutions/editor-core/document/ui/index';

const handles = vi.hoisted(() => ({
  bold: { startAnimation: vi.fn(), stopAnimation: vi.fn() },
  heading1: { startAnimation: vi.fn(), stopAnimation: vi.fn() },
  heading2: { startAnimation: vi.fn(), stopAnimation: vi.fn() },
}));

function mockedIcon(handle: { startAnimation: () => void; stopAnimation: () => void }) {
  return React.forwardRef<unknown, ComponentProps<'span'>>((props, ref) => {
    React.useImperativeHandle(ref, () => handle);
    return <span aria-hidden={props['aria-hidden']} className={props.className} />;
  });
}

vi.mock('@/registry/bases/base-ui/icons/lucide/letter-b-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/letter-b-icon')>()),
  LetterBIcon: mockedIcon(handles.bold),
}));
vi.mock('@/registry/bases/base-ui/icons/lucide/heading-1-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/heading-1-icon')>()),
  Heading1Icon: mockedIcon(handles.heading1),
}));
vi.mock('@/registry/bases/base-ui/icons/lucide/heading-2-icon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/registry/bases/base-ui/icons/lucide/heading-2-icon')>()),
  Heading2Icon: mockedIcon(handles.heading2),
}));

// SlashMenu's popover renders upstream ScrollArea, which measures its
// viewport in a `queueMicrotask` its layout effect schedules on mount,
// outside of `render`'s own act() batch — awaiting a no-op act() settles it
// before the test's assertions run.
async function settle(): Promise<void> {
  await act(async () => {});
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  for (const handle of Object.values(handles)) {
    handle.startAnimation.mockClear();
    handle.stopAnimation.mockClear();
  }
});

function fakeEditor(
  run = vi.fn(() => true),
  selection: EditorSelection = { from: 0, to: 0, empty: true },
  trigger: TriggerQuery | null = null,
  setSlashDecoration: (deco: { from: number; to: number; ghost?: string } | null) => void = () => {},
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
    expect(contributions.slash.some((item) => item.id === 'callout')).toBe(true);
    expect(contributions.slash.some((item) => item.id === 'h1')).toBe(true);
  });
});

describe('filterSlashItems', () => {
  const items = collectUiContributions([standardKit(), callout()]).slash;
  it('matches on title and keywords', () => {
    expect(filterSlashItems(items, 'call').some((i) => i.id === 'callout')).toBe(true);
    expect(filterSlashItems(items, 'todo').some((i) => i.id === 'taskList')).toBe(true);
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
    expect(defaultBlockMenuItems.some((i) => i.command === 'toggleHeading')).toBe(true);
    const del = defaultBlockMenuItems.find((i) => i.id === 'delete');
    expect(del?.separatorBefore).toBe(true);
  });
});

describe('EditorToolbar', () => {
  const items = collectUiContributions([standardKit()]).toolbar;

  it('renders a design-system Toggle + Tooltip per toolbar item', () => {
    const { getByLabelText, container } = render(<EditorToolbar editor={fakeEditor()} items={items} />);
    expect(getByLabelText('Bold')).toBeDefined();
    expect(getByLabelText('Italic')).toBeDefined();
    // Buttons are composed as design-system Tooltip triggers (not a raw `title`).
    expect(container.querySelector('[data-slot="tooltip-trigger"]')).not.toBeNull();
  });

  it('dispatches the item command through the façade on click', () => {
    const run = vi.fn(() => true);
    const { getByLabelText } = render(<EditorToolbar editor={fakeEditor(run)} items={items} />);
    fireEvent.click(getByLabelText('Bold'));
    expect(run).toHaveBeenCalledWith('toggleMark', { name: 'bold' });
  });

  it('reflects active state as aria-pressed', () => {
    const { getByLabelText } = render(<EditorToolbar editor={fakeEditor()} items={items} />);
    expect(getByLabelText('Bold').getAttribute('aria-pressed')).toBe('true');
    expect(getByLabelText('Italic').getAttribute('aria-pressed')).toBe('false');
  });
});

describe('EditorToolbar icons', () => {
  const items = collectUiContributions([standardKit()]).toolbar;

  it("starts a toolbar button's icon on pointer enter and on focus, and stops it on leave and blur", () => {
    const { getByLabelText } = render(<EditorToolbar editor={fakeEditor()} items={items} />);
    const bold = getByLabelText('Bold');
    expect(handles.bold.startAnimation).not.toHaveBeenCalled();

    fireEvent.pointerEnter(bold);
    expect(handles.bold.startAnimation).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(bold);
    expect(handles.bold.stopAnimation).toHaveBeenCalledTimes(1);

    fireEvent.focus(bold);
    expect(handles.bold.startAnimation).toHaveBeenCalledTimes(2);
    fireEvent.blur(bold);
    expect(handles.bold.stopAnimation).toHaveBeenCalledTimes(2);
  });

  it('renders an element icon a feature passes, without a handle', () => {
    const plain = [{ id: 'plain', title: 'Plain', icon: <svg data-testid="plain" />, command: 'noop' }];
    const { getByTestId } = render(<EditorToolbar editor={fakeEditor()} items={plain} />);
    expect(getByTestId('plain')).toBeDefined();
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
    expect(document.body.querySelector('[data-slot="bubble-menu"]')).not.toBeNull();
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

  it('opens inline at the caret and filters by the typed `/query`', async () => {
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
    const { getByText, queryByText } = render(<SlashMenu editor={editor} items={items} />);
    await settle();
    // The popover portals to document.body, so the assertion must query there.
    expect(document.body.querySelector('[data-slot="slash-menu"]')).not.toBeNull();
    // Rows compose the design-system `Item` (not a hand-rolled `<button>` list).
    expect(document.body.querySelector('[data-slot="item"]')).not.toBeNull();
    expect(getByText('Heading 1')).toBeDefined();
    expect(queryByText('Quote')).toBeNull();
  });

  it('renders the design-system `Empty` state when nothing matches', async () => {
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
    await settle();
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

  it('sets the inline placeholder ghost after `/` on an empty query', async () => {
    const setDeco = vi.fn();
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 1, empty: true },
      { query: '', from: 0, to: 1 },
      setDeco,
    );
    render(<SlashMenu editor={editor} items={items} />);
    await settle();
    expect(setDeco).toHaveBeenCalledWith({
      from: 0,
      to: 1,
      ghost: 'Type to search',
    });
  });

  it('paints the `/query` highlight + the highlighted item autocomplete ghost', async () => {
    const setDeco = vi.fn();
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 5, to: 5, empty: true },
      { query: 'head', from: 1, to: 5 },
      setDeco,
    );
    render(<SlashMenu editor={editor} items={items} />);
    await settle();
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

describe('SlashMenu icons', () => {
  const items = collectUiContributions([standardKit()]).slash;

  it("starts a slash row's icon when the arrow keys highlight it", async () => {
    const editor = fakeEditor(
      vi.fn(() => true),
      { from: 1, to: 1, empty: true },
      { query: 'head', from: 0, to: 5 },
    );
    render(<SlashMenu editor={editor} items={items} />);
    await settle();
    expect(handles.heading1.startAnimation).toHaveBeenCalledTimes(1);
    expect(handles.heading2.startAnimation).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(handles.heading2.startAnimation).toHaveBeenCalledTimes(1);
    expect(handles.heading1.stopAnimation).toHaveBeenCalledTimes(1);
  });
});

describe('EditorBlockMenu icons', () => {
  it("starts a row's icon when the arrow keys highlight it, because Base UI moves focus to the highlighted row", async () => {
    const items = [
      { id: 'one', title: 'One', icon: Heading1Icon, command: 'x' },
      { id: 'two', title: 'Two', icon: Heading2Icon, command: 'x' },
    ];
    render(
      <EditorBlockMenu
        editor={fakeEditor()}
        items={items}
        open
        onOpenChange={() => {}}
        anchor={{ top: 10, left: 100, width: 24, height: 24 }}
      />,
    );
    await settle();
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]'));
    expect(rows).toHaveLength(2);

    await act(async () => rows[0].focus());
    expect(handles.heading1.startAnimation).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
    await settle();
    // The highlight is the focus: the second row holds it, its icon started, the first one stopped.
    expect(document.activeElement).toBe(rows[1]);
    expect(rows[1].hasAttribute('data-highlighted')).toBe(true);
    expect(handles.heading2.startAnimation).toHaveBeenCalledTimes(1);
    expect(handles.heading1.stopAnimation).toHaveBeenCalledTimes(1);
  });
});
