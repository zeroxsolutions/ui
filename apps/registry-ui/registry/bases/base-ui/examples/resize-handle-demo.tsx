import { useState, type ReactNode } from 'react';

import { ResizeHandle } from '@/registry/bases/base-ui/components/data-entry/resize-handle';

const MIN_WIDTH = 120;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

/** A side panel next to its content, resized by dragging the handle or toggled shut by a double-click. */
function ResizeHandleDemo(): ReactNode {
  const [width, setWidth] = useState(200);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-40 w-full border">
      <div
        className="bg-muted shrink-0 overflow-hidden p-2 text-sm"
        style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
      >
        {collapsed ? 'Panel' : `Side panel (${width}px)`}
      </div>
      <ResizeHandle
        onDrag={(dx) => {
          if (!collapsed) setWidth((current) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, current + dx)));
        }}
        onToggle={() => setCollapsed((current) => !current)}
      />
      <div className="flex-1 p-2 text-sm">Content</div>
    </div>
  );
}

export { ResizeHandleDemo };
