import type { ReactNode } from 'react';

import { Center } from '@/components/layout/center';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

/** A card with its content centred on both axes. */
function CenterDemo(): ReactNode {
  return (
    <Card className="w-full">
      <CardContent>
        <Center className="h-24">
          <Text className="text-muted-foreground">Centered content</Text>
        </Center>
      </CardContent>
    </Card>
  );
}

export { CenterDemo };
