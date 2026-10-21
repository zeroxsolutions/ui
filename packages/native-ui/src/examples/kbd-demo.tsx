import { Command } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Text } from '@/components/ui/text';

function KbdDemo(): ReactNode {
  return (
    <View className="gap-4">
      <KbdGroup>
        <Kbd>
          <Icon as={Command} />
        </Kbd>
        <Kbd>
          <Text>Shift</Text>
        </Kbd>
        <Kbd>
          <Text>P</Text>
        </Kbd>
      </KbdGroup>
      <View className="flex-row items-center gap-1">
        <Text className="text-muted-foreground text-sm">Press</Text>
        <KbdGroup>
          <Kbd>
            <Text>Ctrl</Text>
          </Kbd>
          <Text className="text-muted-foreground text-sm">+</Text>
          <Kbd>
            <Text>B</Text>
          </Kbd>
        </KbdGroup>
        <Text className="text-muted-foreground text-sm">to bold the selection.</Text>
      </View>
    </View>
  );
}

export { KbdDemo };
