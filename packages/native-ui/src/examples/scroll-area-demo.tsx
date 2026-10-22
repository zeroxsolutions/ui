import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';

const TAGS = Array.from({ length: 30 }, (_, index) => `v1.2.0-beta.${30 - index}`);
const ALBUMS = ['Ornella', 'Tom', 'Vaishali', 'Ana', 'Bao', 'Kenji'];

function ScrollAreaDemo(): ReactNode {
  return (
    <View className="gap-6">
      <ScrollArea className="border-border h-56 rounded-md border">
        <View className="p-4">
          <Text className="mb-4 text-sm font-medium">Tags</Text>
          {TAGS.map((tag) => (
            <View key={tag}>
              <Text className="text-sm">{tag}</Text>
              <Separator className="my-2" />
            </View>
          ))}
        </View>
      </ScrollArea>
      <ScrollArea className="border-border rounded-md border">
        <View className="flex-row gap-4 p-4">
          {ALBUMS.map((name) => (
            <View key={name} className="gap-2">
              <View className="bg-muted h-32 w-24 rounded-md" />
              <Text className="text-muted-foreground text-xs">Photo by {name}</Text>
            </View>
          ))}
        </View>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </View>
  );
}

export { ScrollAreaDemo };
