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
} from '@zeroxsolutions/ui/components/menu-button';

import { ComponentPreview } from '@/components/component-preview';

/**
 * Isolated preview for `MenuButton`. Like `SplitButton`, the radius seam
 * depends on the Root retaining `data-slot="button-group"` (the ButtonGroup
 * primitive's slot) so the descendant `in-data-[slot=button-group]` hooks
 * match. `registry-e2e` reads the computed border-radius of the action and
 * caret segments to verify the seam.
 */
const OPTIONS = [
  { value: 'once', label: 'Allow once' },
  { value: 'session', label: 'Allow this session' },
  { value: 'always', label: 'Always allow' },
] as const;

export default function MenuButtonPreviewPage() {
  const [value, setValue] = useState<(typeof OPTIONS)[number]['value']>('once');
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-lg font-semibold">MenuButton</h1>
      <ComponentPreview>
        <MenuButton aria-label="Remembered action">
          <MenuButtonAction>{current?.label}</MenuButtonAction>
          <MenuButtonMenu>
            <MenuButtonTrigger aria-label="Change action" />
            <MenuButtonContent>
              <MenuButtonRadioGroup
                value={value}
                onValueChange={(next) => setValue(next as typeof value)}
              >
                {OPTIONS.map((option) => (
                  <MenuButtonRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuButtonRadioItem>
                ))}
              </MenuButtonRadioGroup>
            </MenuButtonContent>
          </MenuButtonMenu>
        </MenuButton>
      </ComponentPreview>
    </main>
  );
}
