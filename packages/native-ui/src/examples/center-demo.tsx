import type { ReactNode } from 'react';

import { Center } from '@/components/layout/center';
import { Text } from '@/components/ui/text';

/** A dashed frame with its content centred on both axes. */
function CenterDemo(): ReactNode {
  return (
    <Center className="border-border h-32 w-full rounded-md border border-dashed">
      <Text className="text-muted-foreground text-sm">Centered content</Text>
    </Center>
  );
}

export { CenterDemo };
