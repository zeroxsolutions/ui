import { ArrowRight, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function ButtonDemo(): ReactNode {
  return (
    <View className="items-start gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <Button testID="button-default">
          <Text>Continue</Text>
        </Button>
        <Button variant="outline">
          <Icon as={Plus} />
          <Text>Add</Text>
        </Button>
        <Button variant="secondary">
          <Text>Secondary</Text>
        </Button>
        <Button variant="ghost">
          <Text>Ghost</Text>
        </Button>
        <Button variant="destructive">
          <Text>Delete</Text>
        </Button>
        <Button variant="link">
          <Text>Link</Text>
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Button size="xs">
          <Text>Extra small</Text>
        </Button>
        <Button size="sm">
          <Text>Small</Text>
        </Button>
        <Button size="lg">
          <Text>Large</Text>
        </Button>
        <Button size="icon" variant="outline" aria-label="Next">
          <Icon as={ArrowRight} />
        </Button>
        <Button disabled>
          <Text>Disabled</Text>
        </Button>
      </View>
    </View>
  );
}

export { ButtonDemo };
