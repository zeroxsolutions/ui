import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function RadioGroupDemo(): ReactNode {
  const [plan, setPlan] = useState('monthly');

  return (
    <RadioGroup value={plan} onValueChange={setPlan}>
      <View className="flex-row items-center gap-3">
        <RadioGroupItem value="monthly" aria-label="Monthly" />
        <Label onPress={() => setPlan('monthly')}>Monthly</Label>
      </View>
      <View className="flex-row items-center gap-3">
        <RadioGroupItem value="yearly" aria-label="Yearly" />
        <Label onPress={() => setPlan('yearly')}>Yearly</Label>
      </View>
    </RadioGroup>
  );
}

export { RadioGroupDemo };
