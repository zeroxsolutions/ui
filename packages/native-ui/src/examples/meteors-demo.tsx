import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Meteors } from '@/components/general/meteors';
import { Text } from '@/components/ui/text';

/** Meteors falling behind a heading in a bordered panel. */
function MeteorsDemo(): ReactNode {
  return (
    <View className="bg-background border-border h-64 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border">
      <Meteors number={30} />
      <Text className="text-4xl font-semibold tracking-tight">Meteors</Text>
    </View>
  );
}

export { MeteorsDemo };
