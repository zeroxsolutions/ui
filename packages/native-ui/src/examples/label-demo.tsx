import { useRef, type ReactNode } from 'react';
import { View, type TextInputInstance } from 'react-native';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LabelDemo(): ReactNode {
  const input = useRef<TextInputInstance>(null);

  return (
    <View className="gap-2">
      <Label nativeID="label-demo-email" onPress={() => input.current?.focus()}>
        Email
      </Label>
      <Input ref={input} placeholder="you@example.com" aria-label="Email" aria-labelledby="label-demo-email" />
    </View>
  );
}

export { LabelDemo };
