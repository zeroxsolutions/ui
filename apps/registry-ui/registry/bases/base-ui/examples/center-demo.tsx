import type { ReactNode } from 'react';

import { Center } from '@/registry/bases/base-ui/components/layout/center';

/** A dashed frame with its content centred on both axes. */
function CenterDemo(): ReactNode {
  return (
    <Center className="border-border text-muted-foreground h-32 w-full rounded-md border border-dashed text-sm">
      Centered content
    </Center>
  );
}

export { CenterDemo };
