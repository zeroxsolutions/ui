import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ResizeHandle } from '@chiselart/ui/resize-handle'

const meta: Meta<typeof ResizeHandle> = {
  title: 'Components/ResizeHandle',
  component: ResizeHandle,
}
export default meta

type Story = StoryObj<typeof ResizeHandle>

export const BetweenPanels: Story = {
  render: () => {
    const [width, setWidth] = useState(220)
    const [collapsed, setCollapsed] = useState(false)
    return (
      <div className="flex h-48 overflow-hidden rounded-md border">
        <aside
          className="bg-muted/40 p-3 text-sm"
          style={{ width: collapsed ? 0 : width }}
        >
          {!collapsed && <p className="text-muted-foreground">Side panel — drag the grip →</p>}
        </aside>
        <ResizeHandle
          onDrag={(dx) => setWidth((w) => Math.max(80, Math.min(360, w + dx)))}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 p-3 text-sm">Content</main>
      </div>
    )
  },
}
