import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';

function AvatarDemo(): ReactNode {
  return (
    <View className="flex-row items-center gap-4">
      <Avatar alt="Ada Lovelace" size="sm">
        <AvatarFallback>
          <Text>AL</Text>
        </AvatarFallback>
      </Avatar>
      <Avatar alt="shadcn">
        <AvatarImage source={{ uri: 'https://github.com/shadcn.png' }} />
        <AvatarFallback>
          <Text>CN</Text>
        </AvatarFallback>
      </Avatar>
      <Avatar alt="Grace Hopper" size="lg">
        <AvatarFallback>
          <Text>GH</Text>
        </AvatarFallback>
      </Avatar>
    </View>
  );
}

export { AvatarDemo };
