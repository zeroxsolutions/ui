import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Text } from '@/components/ui/text';

function HoverCardDemo(): ReactNode {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="self-start">
          <Text>@nextjs</Text>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <View className="flex-row justify-between gap-4">
          <Avatar alt="Vercel">
            <AvatarImage source={{ uri: 'https://github.com/vercel.png' }} />
            <AvatarFallback>
              <Text>VC</Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1 gap-1">
            <Text className="text-sm font-semibold">@nextjs</Text>
            <Text className="text-sm">The React Framework, created and maintained by @vercel.</Text>
            <Text className="text-muted-foreground text-xs">Joined December 2021</Text>
          </View>
        </View>
      </HoverCardContent>
    </HoverCard>
  );
}

export { HoverCardDemo };
