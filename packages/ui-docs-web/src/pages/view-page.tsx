import type { ReactNode } from 'react';

import { RegistryExample } from '@zeroxsolutions/ui/site/components/data-display/registry-example';

/** One block alone, with no site chrome, as the frames on the docs and the blocks page show it. `name` is the block's registry name. */
function ViewPage({ name }: { name: string }): ReactNode {
  return (
    <main className="p-6">
      <RegistryExample name={name} />
    </main>
  );
}

export { ViewPage };
