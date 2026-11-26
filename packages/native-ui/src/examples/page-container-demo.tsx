import type { ReactNode } from 'react';
import { View } from 'react-native';

import { PageContainer } from '@/components/layout/page-container';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** A small, centered content column inside a wider surface. */
function PageContainerDemo(): ReactNode {
  return (
    <View className="bg-muted w-full">
      <PageContainer size="sm" className="py-4">
        <Card>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Centered and capped, however wide the surface around it is.</CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    </View>
  );
}

export { PageContainerDemo };
