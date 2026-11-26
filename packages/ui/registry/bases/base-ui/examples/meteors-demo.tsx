import type { ReactNode } from 'react';

import { Meteors } from '@/registry/bases/base-ui/components/general/meteors';
import { Card } from '@/registry/bases/base-ui/ui/card';

/** Meteors falling behind a heading in a bordered panel. */
function MeteorsDemo(): ReactNode {
  return (
    <Card className="relative h-64 w-full max-w-md items-center justify-center">
      <Meteors number={30} />
      <span className="relative text-4xl font-semibold tracking-tight">Meteors</span>
    </Card>
  );
}

export { MeteorsDemo };
