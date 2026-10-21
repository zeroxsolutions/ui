import { Check, Info, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';

function IconDemo(): ReactNode {
  return (
    <View className="flex-row items-center gap-4">
      <Icon as={Check} className="text-primary size-5" />
      <Icon as={Info} className="text-muted-foreground size-6" />
      <Icon as={TriangleAlert} className="text-destructive size-8" />
    </View>
  );
}

export { IconDemo };
