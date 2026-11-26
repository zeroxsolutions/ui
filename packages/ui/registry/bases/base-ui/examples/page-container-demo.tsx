import type { ReactNode } from 'react';

import { PageContainer } from '@/registry/bases/base-ui/components/layout/page-container';
import { Card, CardDescription, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';

/** A small, centered content column inside a wider surface. */
function PageContainerDemo(): ReactNode {
  return (
    <div className="bg-muted w-full">
      <PageContainer size="sm" className="py-4">
        <Card>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Centered and capped, however wide the surface around it is.</CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    </div>
  );
}

export { PageContainerDemo };
