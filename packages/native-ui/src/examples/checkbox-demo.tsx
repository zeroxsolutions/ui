import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';

function CheckboxDemo(): ReactNode {
  const [accepted, setAccepted] = useState(true);
  const [news, setNews] = useState(false);

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <Checkbox checked={accepted} onCheckedChange={setAccepted} aria-label="Accept the terms" />
        <Text>Accept the terms</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Checkbox checked={news} onCheckedChange={setNews} aria-label="Send me news" />
        <Text>Send me news</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Checkbox checked={false} onCheckedChange={() => {}} aria-invalid aria-label="Confirm your age" />
        <Text>Confirm your age</Text>
      </View>
    </View>
  );
}

export { CheckboxDemo };
