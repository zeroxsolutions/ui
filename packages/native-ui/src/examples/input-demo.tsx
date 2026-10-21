import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Input } from '@/components/ui/input';

function InputDemo(): ReactNode {
  return (
    <View className="gap-4">
      <Input placeholder="you@example.com" keyboardType="email-address" aria-label="Email" />
      <Input placeholder="Disabled" editable={false} aria-label="Disabled" />
      <Input defaultValue="not-an-email" aria-invalid aria-label="Invalid email" />
    </View>
  );
}

export { InputDemo };
