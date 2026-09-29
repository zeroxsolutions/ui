import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

/** Every Button variant on one row. */
function ButtonDemo(): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  );
}

export { ButtonDemo };
