import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Text } from '@/components/ui/text';

const DIMENSIONS = [
  { id: 'width', label: 'Width', value: '100%' },
  { id: 'max-width', label: 'Max. width', value: '300px' },
  { id: 'height', label: 'Height', value: '25px' },
  { id: 'max-height', label: 'Max. height', value: 'none' },
] as const;

function PopoverDemo(): ReactNode {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="self-start">
          <Text>Open popover</Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
        <View className="gap-2">
          {DIMENSIONS.map(({ id, label, value }) => (
            <View key={id} className="flex-row items-center gap-4">
              <Label nativeID={`popover-demo-${id}`} className="flex-1">
                {label}
              </Label>
              <Input
                defaultValue={value}
                aria-label={label}
                aria-labelledby={`popover-demo-${id}`}
                className="h-8 flex-[2]"
              />
            </View>
          ))}
        </View>
      </PopoverContent>
    </Popover>
  );
}

export { PopoverDemo };
