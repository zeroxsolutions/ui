import { describe, expect, it } from 'vitest';
import { standardKit, callout } from '../features/index';
import {
  collectUiContributions,
  filterSlashItems,
  groupByHeading,
} from '@zeroxsolutions/editor-core/document/ui/index';

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
