import { Image } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function AspectRatioDemo(): ReactNode {
  return (
    <View className="gap-4">
      <AspectRatio ratio={16 / 9} className="bg-muted items-center justify-center gap-2 rounded-lg">
        <Icon as={Image} className="text-muted-foreground size-8" />
        <Text className="text-muted-foreground text-sm">16 : 9</Text>
      </AspectRatio>
      <View className="w-1/2">
        <AspectRatio ratio={1} className="bg-muted items-center justify-center rounded-lg">
          <Text className="text-muted-foreground text-sm">1 : 1</Text>
        </AspectRatio>
      </View>
    </View>
  );
}

export { AspectRatioDemo };
