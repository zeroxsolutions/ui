import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';

function SheetDemo(): ReactNode {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="self-start">
          <Text>Open</Text>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Make changes to your profile here. Click save when you're done.</SheetDescription>
        </SheetHeader>
        <View className="flex-1 gap-6 px-4">
          <View className="gap-3">
            <Label nativeID="sheet-demo-name">Name</Label>
            <Input defaultValue="Pedro Duarte" aria-label="Name" aria-labelledby="sheet-demo-name" />
          </View>
          <View className="gap-3">
            <Label nativeID="sheet-demo-username">Username</Label>
            <Input defaultValue="@peduarte" aria-label="Username" aria-labelledby="sheet-demo-username" />
          </View>
        </View>
        <SheetFooter>
          <SheetClose asChild>
            <Button>
              <Text>Save changes</Text>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="outline">
              <Text>Close</Text>
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { SheetDemo };
