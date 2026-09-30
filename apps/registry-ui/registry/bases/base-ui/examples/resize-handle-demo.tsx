import { useState, type ReactNode } from 'react';

import { ResizeHandle } from '@/registry/bases/base-ui/components/data-entry/resize-handle';

const MIN_WIDTH = 120;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

/** A panel floating over a canvas, resized by dragging its edge or toggled shut by a double-click. */
function ResizeHandleDemo(): ReactNode {
  const [width, setWidth] = useState(200);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-muted/50 relative h-48 w-full overflow-hidden rounded-lg border">
      <p className="text-muted-foreground absolute right-3 bottom-3 text-sm">Canvas</p>
      <div className="absolute inset-y-3 left-3 flex">
        <div
          className="bg-popover text-popover-foreground overflow-hidden rounded-l-lg border border-r-0 p-2 text-sm"
          style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
        >
          {collapsed ? 'Panel' : `Floating panel (${width}px)`}
        </div>
        <ResizeHandle
          onDrag={(dx) => {
            if (!collapsed) setWidth((current) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, current + dx)));
          }}
          onToggle={() => setCollapsed((current) => !current)}
        />
      </div>
    </div>
  );
}

export { ResizeHandleDemo };
