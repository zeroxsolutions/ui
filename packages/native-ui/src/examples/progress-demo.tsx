import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Progress } from '@/components/ui/progress';

function ProgressDemo(): ReactNode {
  return (
    <View className="gap-4">
      <Progress value={20} aria-label="Download" />
      <Progress value={60} aria-label="Upload" />
      <Progress value={100} aria-label="Sync" />
    </View>
  );
}

export { ProgressDemo };
