import type { ReactNode } from 'react';

import { Center } from '@/registry/bases/base-ui/components/layout/center';
import { Card, CardContent } from '@/registry/bases/base-ui/ui/card';

/** A card with its content centred on both axes. */
function CenterDemo(): ReactNode {
  return (
    <Card className="w-full">
      <CardContent>
        <Center className="text-muted-foreground h-24">Centered content</Center>
      </CardContent>
    </Card>
  );
}

export { CenterDemo };
