import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { ResizeHandle } from '@/components/data-entry/resize-handle';
import { Text } from '@/components/ui/text';

const MIN_WIDTH = 120;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

/** A panel floating over a canvas, resized by dragging its edge or toggled shut by a double tap. */
function ResizeHandleDemo(): ReactNode {
  const [width, setWidth] = useState(160);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View className="bg-muted/50 border-border relative h-48 w-full overflow-hidden rounded-lg border">
      <Text className="text-muted-foreground absolute right-3 bottom-3 text-sm">Canvas</Text>
      <View className="absolute top-3 bottom-3 left-3 flex-row">
        <View
          className="bg-popover border-border overflow-hidden rounded-l-lg border border-r-0 p-2"
          style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
        >
          <Text className="text-popover-foreground text-sm">{collapsed ? 'Panel' : `Floating panel (${width}px)`}</Text>
        </View>
        <ResizeHandle
          aria-label="Resize panel"
          value={collapsed ? COLLAPSED_WIDTH : width}
          min={COLLAPSED_WIDTH}
          max={MAX_WIDTH}
          onDrag={(dx) => {
            if (!collapsed) setWidth((current) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, current + dx)));
          }}
          onToggle={() => setCollapsed((current) => !current)}
        />
      </View>
    </View>
  );
}

export { ResizeHandleDemo };
