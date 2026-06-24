import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { TreeRow } from '@chiselart/ui/tree-row'

const meta: Meta<typeof TreeRow> = {
  title: 'Components/TreeRow',
  component: TreeRow,
}
export default meta

type Story = StoryObj<typeof TreeRow>

export const Nested: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="w-64 text-xs">
        <TreeRow
          depth={0}
          hasChildren
          expanded={open}
          onToggleExpand={() => setOpen((o) => !o)}
          className="hover:bg-accent"
        >
          <span className="py-1">Frame</span>
        </TreeRow>
        {open && (
          <TreeRow depth={1} hasChildren={false} expanded={false} onToggleExpand={() => {}} className="hover:bg-accent">
            <span className="py-1">Rectangle</span>
          </TreeRow>
        )}
      </div>
    )
  },
}
