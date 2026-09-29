'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

const OPTIONS = [
  { value: 'once', label: 'Allow once' },
  { value: 'session', label: 'Allow this session' },
  { value: 'always', label: 'Always allow' },
] as const;

type OptionValue = (typeof OPTIONS)[number]['value'];

/** A remembered-default action whose caret menu picks the default, composed from upstream parts. */
function ButtonGroupMenu(): ReactNode {
  const [value, setValue] = useState<OptionValue>('once');
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <ButtonGroup aria-label="Remembered action">
      <Button variant="outline">{current?.label}</Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Change action" />}>
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => setValue(next as OptionValue)}>
            {OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export { ButtonGroupMenu };
