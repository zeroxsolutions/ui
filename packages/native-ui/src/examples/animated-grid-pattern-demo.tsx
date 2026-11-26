import type { ReactNode } from 'react';

import { AnimatedGridPattern } from '@/components/general/animated-grid-pattern';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

/** A grid whose cells light and fade behind a heading in a bordered panel. */
function AnimatedGridPatternDemo(): ReactNode {
  return (
    <Card className="relative h-64 w-full max-w-md items-center justify-center">
      <AnimatedGridPattern numSquares={30} maxOpacity={0.3} duration={3} />
      <CardContent>
        <Text className="text-4xl font-semibold tracking-tight">Grid</Text>
      </CardContent>
    </Card>
  );
}

export { AnimatedGridPatternDemo };
