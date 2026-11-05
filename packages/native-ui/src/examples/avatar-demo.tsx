import { Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function AvatarDemo(): ReactNode {
  return (
    <View className="gap-6">
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
      <View className="flex-row items-center gap-4">
        <Avatar alt="shadcn, online">
          <AvatarImage source={{ uri: 'https://github.com/shadcn.png' }} />
          <AvatarFallback>
            <Text>CN</Text>
          </AvatarFallback>
          <AvatarBadge className="bg-success" />
        </Avatar>
        <Avatar alt="Grace Hopper, invite pending" size="lg">
          <AvatarFallback>
            <Text>GH</Text>
          </AvatarFallback>
          <AvatarBadge>
            <Icon as={Plus} />
          </AvatarBadge>
        </Avatar>
      </View>
      <AvatarGroup>
        <Avatar alt="shadcn">
          <AvatarImage source={{ uri: 'https://github.com/shadcn.png' }} />
          <AvatarFallback>
            <Text>CN</Text>
          </AvatarFallback>
        </Avatar>
        <Avatar alt="Max Leiter">
          <AvatarImage source={{ uri: 'https://github.com/maxleiter.png' }} />
          <AvatarFallback>
            <Text>ML</Text>
          </AvatarFallback>
        </Avatar>
        <Avatar alt="Evil Rabbit">
          <AvatarImage source={{ uri: 'https://github.com/evilrabbit.png' }} />
          <AvatarFallback>
            <Text>ER</Text>
          </AvatarFallback>
        </Avatar>
        <AvatarGroupCount>
          <Text>+3</Text>
        </AvatarGroupCount>
      </AvatarGroup>
    </View>
  );
}

export { AvatarDemo };
