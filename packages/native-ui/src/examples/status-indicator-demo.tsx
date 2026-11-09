import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StatusIndicator } from '@/components/feedback/status-indicator';
import { Text } from '@/components/ui/text';

/** Every status tone beside its label, with a pulsing connecting state. */
function StatusIndicatorDemo(): ReactNode {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <StatusIndicator tone="online" />
        <Text className="text-sm">Online</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <StatusIndicator tone="online" pulse />
        <Text className="text-sm">Connecting</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <StatusIndicator tone="idle" />
        <Text className="text-sm">Idle</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <StatusIndicator tone="busy" />
        <Text className="text-sm">Busy</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <StatusIndicator tone="offline" />
        <Text className="text-sm">Offline</Text>
      </View>
    </View>
  );
}

export { StatusIndicatorDemo };
