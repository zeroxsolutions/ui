import type { ReactNode } from 'react';

import { PageContainer } from '@/registry/bases/base-ui/components/layout/page-container';

/** A small, centered content column inside a wider surface. */
function PageContainerDemo(): ReactNode {
  return (
    <div className="bg-muted w-full rounded-lg p-4">
      <PageContainer size="sm" className="bg-background rounded-md border p-6">
        <h3 className="text-base font-semibold">Account settings</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Centered and capped, however wide the surface around it is.
        </p>
      </PageContainer>
    </div>
  );
}

export { PageContainerDemo };
