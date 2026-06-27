import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ResizeHandle } from '@zeroxsolutions/ui/resize-handle';

/**
 * `ResizeHandle` is a 1px vertical grip that resizes an adjacent panel by
 * pointer drag. Place it between two panels and wire `onDrag` to apply the width
 * delta; resizing begins only after the pointer crosses a small threshold, so a
 * click or double-click never nudges the size. A double-click fires `onToggle`,
 * typically to collapse or expand the panel.
 */
const meta: Meta<typeof ResizeHandle> = {
  title: 'Components/ResizeHandle',
  component: ResizeHandle,
};
export default meta;

type Story = StoryObj<typeof ResizeHandle>;

/**
 * Drives a resizable side panel against fixed content: dragging the grip clamps
 * the width to 80–360px via `onDrag`, and a double-click collapses or expands
 * the panel via `onToggle`.
 */
export const BetweenPanels: Story = {
  render: () => {
    const [width, setWidth] = useState(220);
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="flex h-48 overflow-hidden rounded-md border">
        <aside
          className="bg-muted/40 p-3 text-sm"
          style={{ width: collapsed ? 0 : width }}
        >
          {!collapsed && (
            <p className="text-muted-foreground">
              Side panel — drag the grip →
            </p>
          )}
        </aside>
        <ResizeHandle
          onDrag={(dx) => setWidth((w) => Math.max(80, Math.min(360, w + dx)))}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 p-3 text-sm">Content</main>
      </div>
    );
  },
};
