import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';

function SpinnerDemo(): ReactNode {
  return (
    <View className="flex-row items-center gap-4">
      <Spinner aria-label="Saving" />
      <Spinner aria-label="Loading" className="size-6" />
      <Button disabled>
        <Spinner aria-label="Submitting" />
        <Text>Submitting</Text>
      </Button>
    </View>
  );
}

export { SpinnerDemo };
