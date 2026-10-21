import { useState, type ReactNode } from 'react';

import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

function ToggleGroupDemo(): ReactNode {
  const [align, setAlign] = useState<string | undefined>('left');

  return (
    <ToggleGroup type="single" value={align} onValueChange={setAlign} variant="outline" spacing={0}>
      <ToggleGroupItem value="left">
        <Text>Left</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <Text>Center</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <Text>Right</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export { ToggleGroupDemo };
