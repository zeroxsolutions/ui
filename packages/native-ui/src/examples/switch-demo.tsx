import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';

function SwitchDemo(): ReactNode {
  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <Switch checked={airplane} onCheckedChange={setAirplane} aria-label="Airplane mode" />
        <Text>Airplane mode</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Switch checked={wifi} onCheckedChange={setWifi} aria-label="Wi-Fi" />
        <Text>Wi-Fi</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Bluetooth" />
        <Text>Bluetooth</Text>
      </View>
    </View>
  );
}

export { SwitchDemo };
