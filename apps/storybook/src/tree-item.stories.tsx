import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eye, Square } from 'lucide-react'
import { useState } from 'react'

import { TreeItem } from '@chiselart/ui/tree-item'

const meta: Meta<typeof TreeItem> = {
  title: 'Components/TreeItem',
  component: TreeItem,
}
export default meta

type Story = StoryObj<typeof TreeItem>

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState(false)
    return (
      <div className="w-64">
        <TreeItem
          depth={1}
          hasChildren={false}
          expanded={false}
          onToggleExpand={() => {}}
          icon={<Square className="size-3.5 text-muted-foreground" />}
          name="Rectangle"
          onActivate={() => setSelected((s) => !s)}
          nameButtonClassName={selected ? 'text-primary' : undefined}
          trailing={
            <button type="button" aria-label="Toggle visibility" className="opacity-0 group-hover:opacity-100">
              <Eye className="size-3.5" />
            </button>
          }
        />
      </div>
    )
  },
}
