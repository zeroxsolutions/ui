import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AnimatedGridPattern } from '@/components/general/animated-grid-pattern';
import { Text } from '@/components/ui/text';

/** A grid whose cells light and fade behind a heading in a bordered panel. */
function AnimatedGridPatternDemo(): ReactNode {
  return (
    <View className="bg-background border-border h-64 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border">
      <AnimatedGridPattern numSquares={30} maxOpacity={0.3} duration={3} />
      <Text className="text-4xl font-semibold tracking-tight">Grid</Text>
    </View>
  );
}

export { AnimatedGridPatternDemo };
