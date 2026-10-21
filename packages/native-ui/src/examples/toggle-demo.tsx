import { Bold, Italic } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';

function ToggleDemo(): ReactNode {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [starred, setStarred] = useState(false);

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">
        <Icon as={Bold} />
      </Toggle>
      <Toggle variant="outline" pressed={italic} onPressedChange={setItalic} aria-label="Italic">
        <Icon as={Italic} />
      </Toggle>
      <Toggle size="sm" variant="outline" pressed={starred} onPressedChange={setStarred}>
        <Text>Starred</Text>
      </Toggle>
    </View>
  );
}

export { ToggleDemo };
