import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';

function showWithAction() {
  const id = toast.add({
    title: 'Event created',
    description: 'You can undo this action.',
    actionProps: {
      children: 'Undo',
      onPress() {
        toast.close(id);
        toast.add({ description: 'Event creation undone.' });
      },
    },
  });
}

function showPromise() {
  void toast.promise(
    new Promise<{ name: string }>((resolve) => {
      setTimeout(() => resolve({ name: 'Event' }), 2000);
    }),
    {
      loading: 'Creating event...',
      success: (data) => `${data.name} created.`,
      error: 'Could not create event.',
    },
  );
}

function ToastDemo(): ReactNode {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button
        variant="outline"
        onPress={() => toast.add({ title: 'Event created', description: 'Sunday, December 3 at 9:00 AM' })}
      >
        <Text>Show Toast</Text>
      </Button>
      <Button variant="outline" onPress={showWithAction}>
        <Text>With Action</Text>
      </Button>
      <Button variant="outline" onPress={showPromise}>
        <Text>Create Event</Text>
      </Button>
    </View>
  );
}

export { ToastDemo };
