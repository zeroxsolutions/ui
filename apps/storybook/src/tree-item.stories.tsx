import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eye, Frame, Image, Square, Type } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@chiselart/ui/button'
import { TreeItem } from '@chiselart/ui/tree-item'

const meta: Meta<typeof TreeItem> = {
  title: 'Components/TreeItem',
  component: TreeItem,
}
export default meta

type Story = StoryObj<typeof TreeItem>

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ')

interface Node {
  id: string
  name: string
  depth: number
  parentId?: string
  hasChildren: boolean
  icon: ReactNode
}

const ICON = 'size-3.5 text-muted-foreground'
const NODES: Node[] = [
  { id: 'hero', name: 'Hero', depth: 0, hasChildren: true, icon: <Frame className={ICON} /> },
  { id: 'title', name: 'Title', depth: 1, parentId: 'hero', hasChildren: false, icon: <Type className={ICON} /> },
  { id: 'actions', name: 'Actions', depth: 1, parentId: 'hero', hasChildren: true, icon: <Frame className={ICON} /> },
  { id: 'primary', name: 'Get started', depth: 2, parentId: 'actions', hasChildren: false, icon: <Square className={ICON} /> },
  { id: 'secondary', name: 'Learn more', depth: 2, parentId: 'actions', hasChildren: false, icon: <Square className={ICON} /> },
  { id: 'cover', name: 'Cover image', depth: 1, parentId: 'hero', hasChildren: false, icon: <Image className={ICON} /> },
]

const byId = (id: string) => NODES.find((n) => n.id === id)

/** Is `ancestorId` an ancestor of `node` (so `node` lives inside its subtree)? */
function isDescendantOf(node: Node, ancestorId: string): boolean {
  let pid = node.parentId
  while (pid) {
    if (pid === ancestorId) return true
    pid = byId(pid)?.parentId
  }
  return false
}

/**
 * A real hierarchy in the design-system's own selection language: selecting a
 * parent fills it with `accent` (the same neutral token the sidebar/select use
 * for an active row) and its descendants get a lighter `accent/50` so the
 * selection's contents read as one group. Selection/hover is the caller's via
 * `className`; TreeItem owns only the indent, chevron, name button, and trailing
 * slot.
 */
export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState('actions')
    const [expanded, setExpanded] = useState<Set<string>>(
      () => new Set(['hero', 'actions']),
    )

    const toggle = (id: string) =>
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })

    const visible = NODES.filter((n) => {
      let pid = n.parentId
      while (pid) {
        if (!expanded.has(pid)) return false
        pid = byId(pid)?.parentId
      }
      return true
    })

    return (
      <div className="w-64 select-none p-1">
        {visible.map((n) => {
          const isSelected = selected === n.id
          const inSelectedSubtree = isDescendantOf(n, selected)
          return (
            <TreeItem
              key={n.id}
              depth={n.depth}
              hasChildren={n.hasChildren}
              expanded={expanded.has(n.id)}
              onToggleExpand={() => toggle(n.id)}
              icon={n.icon}
              name={n.name}
              onActivate={() => setSelected(n.id)}
              className={cx(
                'h-7',
                isSelected && 'bg-accent font-medium',
                !isSelected && inSelectedSubtree && 'bg-accent/50',
                !isSelected && !inSelectedSubtree && 'hover:bg-muted',
              )}
              trailing={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Toggle ${n.name} visibility`}
                  className="mr-1 text-muted-foreground opacity-0 group-hover:opacity-100"
                >
                  <Eye />
                </Button>
              }
            />
          )
        })}
      </div>
    )
  },
}
