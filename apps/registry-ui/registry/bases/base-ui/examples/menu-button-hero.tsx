'use client';

import { useState } from 'react';

import {
  MenuButton,
  MenuButtonAction,
  MenuButtonContent,
  MenuButtonMenu,
  MenuButtonRadioGroup,
  MenuButtonRadioItem,
  MenuButtonTrigger,
} from '@/registry/bases/base-ui/components/layout/menu-button';

const OPTIONS = [
  { value: 'once', label: 'Allow once' },
  { value: 'session', label: 'Allow this session' },
  { value: 'always', label: 'Always allow' },
] as const;

type OptionValue = (typeof OPTIONS)[number]['value'];

/** A remembered-default split control - the MenuButton hero (stateful). */
export function MenuButtonHero() {
  const [value, setValue] = useState<OptionValue>('once');
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <MenuButton aria-label="Remembered action">
      <MenuButtonAction>{current?.label}</MenuButtonAction>
      <MenuButtonMenu>
        <MenuButtonTrigger aria-label="Change action" />
        <MenuButtonContent>
          <MenuButtonRadioGroup value={value} onValueChange={(next) => setValue(next as OptionValue)}>
            {OPTIONS.map((option) => (
              <MenuButtonRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuButtonRadioItem>
            ))}
          </MenuButtonRadioGroup>
        </MenuButtonContent>
      </MenuButtonMenu>
    </MenuButton>
  );
}
