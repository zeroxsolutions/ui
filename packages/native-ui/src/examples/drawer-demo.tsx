import { Minus, Plus } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** The goals of the last thirteen days, drawn as bars. */
const GOALS = [400, 300, 200, 300, 200, 278, 189, 239, 300, 200, 278, 189, 349];

function DrawerDemo(): ReactNode {
  const [goal, setGoal] = useState(350);
  const adjust = (adjustment: number): void => setGoal(Math.max(200, Math.min(400, goal + adjustment)));

  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger asChild>
        <Button variant="outline" className="self-start">
          <Text>Open Drawer</Text>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move Goal</DrawerTitle>
          <DrawerDescription>Set your daily activity goal.</DrawerDescription>
        </DrawerHeader>
        <View className="p-4 pb-0">
          <View className="flex-row items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              aria-label="Decrease"
              onPress={() => adjust(-10)}
              disabled={goal <= 200}
            >
              <Icon as={Minus} />
            </Button>
            <View className="flex-1 items-center">
              <Text className="text-7xl font-bold tracking-tighter">{goal}</Text>
              <Text className="text-muted-foreground text-[11px] uppercase">Calories/day</Text>
            </View>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              aria-label="Increase"
              onPress={() => adjust(10)}
              disabled={goal >= 400}
            >
              <Icon as={Plus} />
            </Button>
          </View>
          <View aria-hidden className="mt-3 h-[120px] flex-row items-end gap-1">
            {GOALS.map((day, index) => (
              <View
                key={index}
                className="bg-foreground flex-1 opacity-90"
                style={{ height: `${(day / 400) * 100}%` as const }}
              />
            ))}
          </View>
        </View>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>
              <Text>Submit</Text>
            </Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export { DrawerDemo };
