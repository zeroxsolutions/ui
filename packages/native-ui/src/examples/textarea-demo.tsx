import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Textarea } from '@/components/ui/textarea';

function TextareaDemo(): ReactNode {
  return (
    <View className="gap-4">
      <Textarea placeholder="Tell us more" aria-label="Notes" />
      <Textarea defaultValue="Too short" aria-invalid aria-label="Invalid notes" />
    </View>
  );
}

export { TextareaDemo };
