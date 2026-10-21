import { BadgeCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function BadgeDemo(): ReactNode {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Badge>
        <Text>Default</Text>
      </Badge>
      <Badge variant="secondary">
        <Text>New</Text>
      </Badge>
      <Badge variant="destructive">
        <Text>Overdue</Text>
      </Badge>
      <Badge variant="outline">
        <Icon as={BadgeCheck} />
        <Text>Verified</Text>
      </Badge>
      <Badge variant="ghost">
        <Text>Ghost</Text>
      </Badge>
      <Badge variant="link">
        <Text>Link</Text>
      </Badge>
    </View>
  );
}

export { BadgeDemo };
