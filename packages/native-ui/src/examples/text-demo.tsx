import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

function TextDemo(): ReactNode {
  return (
    <View className="gap-2">
      <Text>Saved</Text>
      <Text className="font-sans-medium text-sm">Medium</Text>
      <Text className="font-sans-semibold text-muted-foreground text-sm">Last edited today</Text>
      <Text className="font-sans-bold text-lg">Invoice 1042</Text>
    </View>
  );
}

export { TextDemo };
