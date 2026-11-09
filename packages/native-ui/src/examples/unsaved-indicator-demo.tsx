import type { ReactNode } from 'react';
import { View } from 'react-native';

import { UnsavedIndicator } from '@/components/feedback/unsaved-indicator';
import { Text } from '@/components/ui/text';

/** The unsaved dot beside a tab label with pending edits. */
function UnsavedIndicatorDemo(): ReactNode {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm">page.tsx</Text>
      <UnsavedIndicator />
    </View>
  );
}

export { UnsavedIndicatorDemo };
