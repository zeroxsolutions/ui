import type { ReactNode } from 'react';

import { Meteors } from '@/components/general/meteors';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

/** Meteors falling behind a heading in a bordered panel. */
function MeteorsDemo(): ReactNode {
  return (
    <Card className="relative h-64 w-full max-w-md items-center justify-center">
      <Meteors number={30} />
      <CardContent>
        <Text className="text-4xl font-semibold tracking-tight">Meteors</Text>
      </CardContent>
    </Card>
  );
}

export { MeteorsDemo };
