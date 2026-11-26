import type { ReactNode } from 'react';

import { AnimatedGridPattern } from '@/registry/bases/base-ui/components/general/animated-grid-pattern';
import { Card } from '@/registry/bases/base-ui/ui/card';

/** A grid whose cells light and fade behind a heading, masked to fade toward the panel's edges. */
function AnimatedGridPatternDemo(): ReactNode {
  return (
    <Card className="relative h-64 w-full max-w-md items-center justify-center">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.3}
        duration={3}
        className="mask-radial-from-40% mask-radial-to-80%"
      />
      <span className="relative text-4xl font-semibold tracking-tight">Grid</span>
    </Card>
  );
}

export { AnimatedGridPatternDemo };
