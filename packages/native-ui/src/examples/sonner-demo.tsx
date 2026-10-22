import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Text } from '@/components/ui/text';

function SonnerDemo(): ReactNode {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button variant="outline" onPress={() => toast('Event has been created')}>
        <Text>Show Toast</Text>
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast('Event has been created', {
            description: 'Monday, January 3rd at 6:00pm',
            action: { label: 'Undo', onClick: () => toast('Event removed') },
          })
        }
      >
        <Text>With Description</Text>
      </Button>
      <Button variant="outline" onPress={() => toast.success('Event has been created')}>
        <Text>Success</Text>
      </Button>
      <Button variant="outline" onPress={() => toast.error('Event could not be created')}>
        <Text>Error</Text>
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.promise(new Promise<string>((resolve) => setTimeout(() => resolve('Event'), 2000)), {
            loading: 'Creating event...',
            success: (name: string) => `${name} has been created`,
            error: 'Event could not be created',
          })
        }
      >
        <Text>Promise</Text>
      </Button>
    </View>
  );
}

export { SonnerDemo };
