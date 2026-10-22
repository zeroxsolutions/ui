import { BadgeCheck, ChevronRight, ShieldAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { Text } from '@/components/ui/text';

function ItemDemo(): ReactNode {
  return (
    <View className="gap-6">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Icon as={ShieldAlert} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Two-factor authentication</ItemTitle>
          <ItemDescription>Protect your account with a code from your phone.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            <Text>Enable</Text>
          </Button>
        </ItemActions>
      </Item>
      <Item variant="muted" size="sm" asChild>
        <Pressable role="button" onPress={() => undefined}>
          <ItemMedia variant="icon">
            <Icon as={BadgeCheck} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Your profile is verified</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Icon as={ChevronRight} className="size-4" />
          </ItemActions>
        </Pressable>
      </Item>
      <ItemGroup>
        <Item size="sm">
          <ItemMedia>
            <Avatar alt="Ana Silva">
              <AvatarFallback>
                <Text>A</Text>
              </AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Ana Silva</ItemTitle>
            <ItemDescription>Editor</ItemDescription>
          </ItemContent>
        </Item>
        <ItemSeparator />
        <Item size="sm">
          <ItemMedia>
            <Avatar alt="Bao Tran">
              <AvatarFallback>
                <Text>B</Text>
              </AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Bao Tran</ItemTitle>
            <ItemDescription>Viewer</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </View>
  );
}

export { ItemDemo };
