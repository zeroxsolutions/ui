import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { TreeRow } from '@chiselart/ui/tree-row'

const meta: Meta<typeof TreeRow> = {
  title: 'Components/TreeRow',
  component: TreeRow,
}
export default meta

type Story = StoryObj<typeof TreeRow>

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ')

/**
 * The shared row skeleton: indent + disclosure chevron + caller content. The
 * row's selection/hover COLOUR is the caller's via `className` — here a click
 * selects a row and fills it with the neutral `accent` token (the same one the
 * sidebar/select use for an active row), so the row reads as part of the design
 * system, not a one-off.
 */
export const Nested: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    const [selected, setSelected] = useState('rectangle')

    const rowClass = (id: string) =>
      cx(selected === id ? 'bg-accent font-medium' : 'hover:bg-muted')

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
    )
  },
}
