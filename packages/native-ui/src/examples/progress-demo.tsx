import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';

function ProgressDemo(): ReactNode {
  return (
    <View className="gap-4">
      <Progress value={20} aria-label="Download" />
      <Progress value={60} aria-label="Upload" />
      <Progress value={100} aria-label="Sync" />
      <Progress value={56}>
        <ProgressLabel>Upload progress</ProgressLabel>
        <ProgressValue />
      </Progress>
    </View>
  );
}

export { ProgressDemo };
