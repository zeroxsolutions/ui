import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { ResizeHandle } from '@/components/data-entry/resize-handle';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

const MIN_WIDTH = 120;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

/** A panel floating over a canvas, resized by dragging its edge or toggled shut by a double tap. */
function ResizeHandleDemo(): ReactNode {
  const [width, setWidth] = useState(160);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card className="h-48 w-full">
      <CardContent className="flex-1 flex-row justify-between">
        <View className="flex-row">
          <Card size="sm" style={{ width: collapsed ? COLLAPSED_WIDTH : width }}>
            <CardContent>
              <Text>{collapsed ? 'Panel' : `Floating panel (${width}px)`}</Text>
            </CardContent>
          </Card>
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
        <Text className="text-muted-foreground self-end">Canvas</Text>
      </CardContent>
    </Card>
  );
}

export { ResizeHandleDemo };
