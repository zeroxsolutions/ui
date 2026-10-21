import { useState, type ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';

function TabsDemo(): ReactNode {
  const [tab, setTab] = useState('account');

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="account">
          <Text>Account</Text>
        </TabsTrigger>
        <TabsTrigger value="password">
          <Text>Password</Text>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Text>Make changes to your account.</Text>
      </TabsContent>
      <TabsContent value="password">
        <Text>Change your password.</Text>
      </TabsContent>
    </Tabs>
  );
}

export { TabsDemo };
