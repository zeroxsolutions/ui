import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { TreeRow } from '@zeroxsolutions/ui/components/tree-row';

/**
 * `TreeRow` is the shared skeleton of one row in a hierarchy tree (a layer tree, a
 * scene outliner, a file tree): a flex `group` container with depth indent
 * (`baseIndent + depth * indentStep` px of left padding) and a disclosure chevron
 * that rotates 90° when `expanded`, or a same-width spacer for leaves so names stay
 * aligned. Everything that legitimately differs stays caller-owned — selection/hover
 * colour and row height via `className`, the row content via `children`, and
 * drag/drop handlers spread straight onto the row.
 */
const meta: Meta<typeof TreeRow> = {
  title: 'Components/TreeRow',
  component: TreeRow,
};
export default meta;

type Story = StoryObj<typeof TreeRow>;

const cx = (...c: Array<string | false | undefined>) =>
  c.filter(Boolean).join(' ');

/**
 * The shared row skeleton: indent + disclosure chevron + caller content. The
 * row's selection/hover COLOUR is the caller's via `className` — here a click
 * selects a row and fills it with the neutral `accent` token (the same one the
 * sidebar/select use for an active row), so the row reads as part of the design
 * system, not a one-off.
 */
export const Nested: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [selected, setSelected] = useState('rectangle');

    const rowClass = (id: string) =>
      cx(selected === id ? 'bg-accent font-medium' : 'hover:bg-muted');

    return (
      <div className="w-64 text-xs">
        <TreeRow
          depth={0}
          hasChildren
          expanded={open}
          onToggleExpand={() => setOpen((o) => !o)}
          onClick={() => setSelected('frame')}
          className={rowClass('frame')}
        >
          <span className="py-1">Frame</span>
        </TreeRow>
        {open && (
          <>
            <TreeRow
              depth={1}
              hasChildren={false}
              expanded={false}
              onToggleExpand={() => {}}
              onClick={() => setSelected('rectangle')}
              className={rowClass('rectangle')}
            >
              <span className="py-1">Rectangle</span>
            </TreeRow>
            <TreeRow
              depth={1}
              hasChildren={false}
              expanded={false}
              onToggleExpand={() => {}}
              onClick={() => setSelected('label')}
              className={rowClass('label')}
            >
              <span className="py-1">Label</span>
            </TreeRow>
          </>
        )}
      </div>
    );
  },
};
