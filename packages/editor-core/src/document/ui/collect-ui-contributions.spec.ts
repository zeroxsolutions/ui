import { describe, expect, it } from 'vitest';
import type { EditorFeature, SlashItem } from '../core/index.js';
import { collectUiContributions, filterSlashItems, groupByHeading } from './collect-ui-contributions.js';

const item = (id: string, title: string, extra: Partial<SlashItem> = {}): SlashItem => ({
  id,
  title,
  command: id,
  ...extra,
});

describe('collectUiContributions', () => {
  it("gathers each surface's items across the features, in the features' order", () => {
    const first: EditorFeature = {
      id: 'first',
      slash: [item('h1', 'Heading 1')],
      toolbar: [item('bold', 'Bold')],
      bubble: [item('link', 'Link')],
    };
    const second: EditorFeature = { id: 'second', slash: [item('callout', 'Callout')], blockMenu: [item('x', 'X')] };
    const contributions = collectUiContributions([first, second]);
    expect(contributions.slash.map(({ id }) => id)).toEqual(['h1', 'callout']);
    expect(contributions.toolbar.map(({ id }) => id)).toEqual(['bold']);
    expect(contributions.bubble.map(({ id }) => id)).toEqual(['link']);
    expect(contributions.blockMenu.map(({ id }) => id)).toEqual(['x']);
  });
});

describe('filterSlashItems', () => {
  const items = [item('callout', 'Callout'), item('taskList', 'To-do list', { keywords: ['Todo', 'checkbox'] })];

  it('matches a query against the title and the keywords, ignoring case and the space around it', () => {
    expect(filterSlashItems(items, ' CALL ').map(({ id }) => id)).toEqual(['callout']);
    expect(filterSlashItems(items, 'todo').map(({ id }) => id)).toEqual(['taskList']);
  });

  it('keeps every item for a blank query', () => {
    expect(filterSlashItems(items, '  ')).toEqual(items);
  });
});

describe('groupByHeading', () => {
  it('groups items under their heading in the order each heading first appears, the ungrouped under the fallback', () => {
    const groups = groupByHeading([{ id: 'a', group: 'X' }, { id: 'b' }, { id: 'c', group: 'X' }]);
    expect(groups).toEqual([
      [
        'X',
        [
          { id: 'a', group: 'X' },
          { id: 'c', group: 'X' },
        ],
      ],
      ['Blocks', [{ id: 'b' }]],
    ]);
  });
});
