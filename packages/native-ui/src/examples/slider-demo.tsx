import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/text';

function SliderDemo(): ReactNode {
  const [temperature, setTemperature] = useState<readonly number[]>([0.3, 0.7]);

  return (
    <View className="gap-8">
      <Slider defaultValue={50} max={100} step={1} aria-label="Volume" />
      <Slider defaultValue={[25, 50]} max={100} step={5} aria-label="Price" />
      <Slider defaultValue={[10, 20, 70]} max={100} step={10} aria-label="Stops" />
      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-2">
          <Label nativeID="slider-demo-temperature">Temperature</Label>
          <Text className="text-muted-foreground text-sm">{temperature.join(', ')}</Text>
        </View>
        <Slider
          value={temperature}
          onValueChange={(value) => setTemperature(value as readonly number[])}
          min={0}
          max={1}
          step={0.1}
          aria-labelledby="slider-demo-temperature"
          aria-label="Temperature"
        />
      </View>
      <View className="h-40 flex-row items-center gap-6">
        <Slider defaultValue={[50]} max={100} step={1} orientation="vertical" aria-label="Bass" />
        <Slider defaultValue={[25]} max={100} step={1} orientation="vertical" aria-label="Treble" />
      </View>
      <Slider defaultValue={[50]} max={100} step={1} disabled aria-label="Balance" />
    </View>
  );
}

export { SliderDemo };
