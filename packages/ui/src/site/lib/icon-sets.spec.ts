// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { filterIconSets, iconSets } from './icon-sets';

const item = (name: string, path: string) => ({ name, files: [{ path }] });

describe('iconSets', () => {
  it('groups the items whose file sits under icons/<set>/ by set, each icon under its glyph', () => {
    const items = [
      item('button', 'registry/bases/base-ui/ui/button.tsx'),
      item('lucide-copy-icon', 'registry/bases/base-ui/icons/lucide/copy-icon.tsx'),
      item('lucide-arrow-up-icon', 'registry/bases/base-ui/icons/lucide/arrow-up-icon.tsx'),
      item('other-star-icon', 'src/registry/icons/other/star-icon.tsx'),
    ];

    expect(iconSets(items)).toEqual([
      {
        set: 'lucide',
        icons: [
          { name: 'lucide-arrow-up-icon', glyph: 'arrow-up' },
          { name: 'lucide-copy-icon', glyph: 'copy' },
        ],
      },
      { set: 'other', icons: [{ name: 'other-star-icon', glyph: 'star' }] },
    ]);
  });

  it('reads no icon from an item with no files', () => {
    expect(iconSets([{ name: 'lucide-utils' }])).toEqual([]);
  });
});

describe('filterIconSets', () => {
  const sets = iconSets([
    item('lucide-arrow-up-icon', 'icons/lucide/arrow-up-icon.tsx'),
    item('lucide-arrow-up-right-icon', 'icons/lucide/arrow-up-right-icon.tsx'),
    item('lucide-arrow-down-icon', 'icons/lucide/arrow-down-icon.tsx'),
    item('other-star-icon', 'icons/other/star-icon.tsx'),
  ]);

  it('keeps the icons whose glyph holds the query, read as a glyph name, and drops a set left empty', () => {
    expect(filterIconSets(sets, ' Arrow  Up ')).toEqual([
      {
        set: 'lucide',
        icons: [
          { name: 'lucide-arrow-up-icon', glyph: 'arrow-up' },
          { name: 'lucide-arrow-up-right-icon', glyph: 'arrow-up-right' },
        ],
      },
    ]);
  });

  it('keeps every set whole for an empty query', () => {
    expect(filterIconSets(sets, '  ')).toEqual(sets);
  });
});
