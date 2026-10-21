import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';

function SeparatorDemo(): ReactNode {
  return (
    <View className="gap-3">
      <Text className="font-sans-medium">Account</Text>
      <Separator />
      <View className="flex-row items-center gap-3">
        <Text>Profile</Text>
        <Separator orientation="vertical" className="h-6" />
        <Text>Billing</Text>
        <Separator orientation="vertical" className="h-6" />
        <Text>Security</Text>
      </View>
    </View>
  );
}

export { SeparatorDemo };
