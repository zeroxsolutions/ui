import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function TooltipDemo(): ReactNode {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className="self-start">
          <Text>Hover</Text>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Text>Add to library</Text>
      </TooltipContent>
    </Tooltip>
  );
}

export { TooltipDemo };
