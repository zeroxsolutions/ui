import { describe, expect, it } from 'vitest';

import { Components } from './__components__';
import { EditorComponents } from './__editor-components__';
import { IconComponents } from './__icon-components__';
import { Index } from './__index__';

describe('examples', () => {
  it('splits the demos between the maps, every animated icon in the icon map alone', () => {
    const plain = Object.keys(Components);
    const editor = Object.keys(EditorComponents);
    const icons = Object.keys(IconComponents);

    expect(plain.filter((name) => editor.includes(name) || icons.includes(name))).toEqual([]);
    expect(editor.filter((name) => icons.includes(name))).toEqual([]);
    expect([...plain, ...editor, ...icons].sort()).toEqual(Object.keys(Index).sort());
    expect(icons.sort()).toEqual(
      Object.values(Index)
        .filter(({ files: [file] }) => file.startsWith('registry/bases/base-ui/icons/'))
        .map(({ name }) => name)
        .sort(),
    );
  });
});
