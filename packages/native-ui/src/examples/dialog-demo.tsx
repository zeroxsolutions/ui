import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

function DialogDemo(): ReactNode {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="self-start">
          <Text>Open Dialog</Text>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <View className="gap-4">
          <View className="gap-3">
            <Label nativeID="dialog-demo-name">Name</Label>
            <Input defaultValue="Pedro Duarte" aria-label="Name" aria-labelledby="dialog-demo-name" />
          </View>
          <View className="gap-3">
            <Label nativeID="dialog-demo-username">Username</Label>
            <Input defaultValue="@peduarte" aria-label="Username" aria-labelledby="dialog-demo-username" />
          </View>
        </View>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>
              <Text>Save changes</Text>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DialogDemo };
