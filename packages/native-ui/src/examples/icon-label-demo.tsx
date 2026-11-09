import { Blend, RotateCw, Search } from 'lucide-react-native';
import { useRef, type ReactNode } from 'react';
import { View, type TextInputInstance } from 'react-native';

import { IconLabel } from '@/components/general/icon-label';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** A universally-read field icon beside two others whose meaning a composed tooltip shows when pressed. */
function IconLabelDemo(): ReactNode {
  const filter = useRef<TextInputInstance>(null);

  return (
    <View className="flex-row flex-wrap items-center gap-4">
      <View className="flex-row items-center gap-2">
        <IconLabel aria-label="Filter" nativeID="icon-label-demo-filter" onPress={() => filter.current?.focus()}>
          <Icon as={Search} />
        </IconLabel>
        <Input
          ref={filter}
          aria-label="Filter"
          aria-labelledby="icon-label-demo-filter"
          placeholder="Filter..."
          className="w-32"
        />
      </View>
      <View className="flex-row items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconLabel aria-label="Rotation" nativeID="icon-label-demo-rotation">
              <Icon as={RotateCw} />
            </IconLabel>
          </TooltipTrigger>
          <TooltipContent>
            <Text>Rotation</Text>
          </TooltipContent>
        </Tooltip>
        <Input
          aria-label="Rotation"
          aria-labelledby="icon-label-demo-rotation"
          keyboardType="numeric"
          defaultValue="0"
          className="w-20"
        />
      </View>
      <View className="flex-row items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconLabel aria-label="Opacity" nativeID="icon-label-demo-opacity">
              <Icon as={Blend} />
            </IconLabel>
          </TooltipTrigger>
          <TooltipContent>
            <Text>Opacity</Text>
          </TooltipContent>
        </Tooltip>
        <Input
          aria-label="Opacity"
          aria-labelledby="icon-label-demo-opacity"
          keyboardType="numeric"
          defaultValue="100"
          className="w-20"
        />
      </View>
    </View>
  );
}

export { IconLabelDemo };
