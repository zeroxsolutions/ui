import type { ReactNode } from 'react';

import { Meteors } from '@/registry/bases/base-ui/components/general/meteors';

/** Meteors falling behind a heading in a bordered panel. */
function MeteorsDemo(): ReactNode {
  return (
    <div className="bg-background relative flex h-64 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border">
      <Meteors number={30} />
      <span className="relative text-4xl font-semibold tracking-tight">Meteors</span>
    </div>
  );
}

export { MeteorsDemo };
