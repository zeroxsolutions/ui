import { ChevronsUpDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function CollapsibleDemo(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="gap-2">
      <View className="flex-row items-center justify-between gap-4 px-4">
        <Text className="text-sm font-semibold">@peduarte starred 3 repositories</Text>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle">
            <Icon as={ChevronsUpDown} />
          </Button>
        </CollapsibleTrigger>
      </View>
      <View className="border-border rounded-md border px-4 py-2">
        <Text className="text-sm">@radix-ui/primitives</Text>
      </View>
      <CollapsibleContent className="gap-2">
        <View className="border-border rounded-md border px-4 py-2">
          <Text className="text-sm">@radix-ui/colors</Text>
        </View>
        <View className="border-border rounded-md border px-4 py-2">
          <Text className="text-sm">@stitches/react</Text>
        </View>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { CollapsibleDemo };
