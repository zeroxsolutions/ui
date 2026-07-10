import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IEditor } from '../core/index.js';
import { standardKit, callout } from '../features/index.js';
import { EditorToolbar } from './editor-toolbar.js';
import {
  collectUiContributions,
  defaultBlockMenuItems,
  filterSlashItems,
  groupByHeading,
} from './collect-ui-contributions.js';

afterEach(cleanup);

function fakeEditor(run = vi.fn(() => true)): IEditor {
  return {
    status: 'ready',
    isActive: (name: string) => name === 'bold',
    run,
    can: () => true,
    onChange: () => () => {},
    onSnapshot: () => () => {},
    isEditable: () => true,
    isFocused: () => true,
    getSelection: () => ({ from: 0, to: 0, empty: true }),
    focus: () => {},
    blur: () => {},
  } as unknown as IEditor;
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

  it('renders a button per toolbar item', () => {
    const { getByLabelText } = render(<EditorToolbar editor={fakeEditor()} items={items} />);
    expect(getByLabelText('Bold')).toBeDefined();
    expect(getByLabelText('Italic')).toBeDefined();
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
