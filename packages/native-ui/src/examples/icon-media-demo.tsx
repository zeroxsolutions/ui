import { Eye, MessageSquare, Wrench } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconMedia } from '@/components/general/icon-media';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** A chat-ability glyph named by its own caption, beside two named only through a composed tooltip. */
function IconMediaDemo(): ReactNode {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-row items-center gap-1.5">
        <IconMedia aria-label="Chat" className="bg-primary text-primary-foreground">
          <Icon as={MessageSquare} />
        </IconMedia>
        <Text className="text-sm">Chat</Text>
      </View>
      <Tooltip>
        <TooltipTrigger aria-label="Vision input">
          <IconMedia className="bg-muted text-muted-foreground">
            <Icon as={Eye} />
          </IconMedia>
        </TooltipTrigger>
        <TooltipContent>
          <Text>Vision input</Text>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger aria-label="Tool use">
          <IconMedia className="bg-muted text-muted-foreground">
            <Icon as={Wrench} />
          </IconMedia>
        </TooltipTrigger>
        <TooltipContent>
          <Text>Tool use</Text>
        </TooltipContent>
      </Tooltip>
    </View>
  );
}

export { IconMediaDemo };
