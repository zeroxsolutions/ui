'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

/** A primary action plus a caret menu of related actions, composed from upstream parts. */
function SplitButtonHero() {
  return (
    <ButtonGroup aria-label="Allow">
      <Button variant="outline">Action</Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="More action options" />}>
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem onClick={() => {}}>Second</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Third</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export { SplitButtonHero };
