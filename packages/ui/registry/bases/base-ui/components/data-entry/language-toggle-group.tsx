'use client';

import type { ComponentProps, ReactNode } from 'react';

import { ToggleGroup } from '@/registry/bases/base-ui/ui/toggle-group';

interface LanguageToggleGroupProps extends Omit<
  ComponentProps<typeof ToggleGroup>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
> {
  /** The selected language's value; the item whose `value` equals it is pressed. */
  value: string;
  /** Called with a newly pressed item's `value`. Pressing the current item reports nothing. */
  onValueChange: (value: string) => void;
}

/**
 * Every language shown inline as a single-select toggle group, for a small fixed
 * set (two to four). The consumer composes one `ToggleGroupItem` per option,
 * usually mapping `useLanguageOptions`; the group never deselects, so a language
 * is always chosen. Outlined, at the toggle group's default spacing, unless `variant` or `spacing` say otherwise.
 */
function LanguageToggleGroup({ value, onValueChange, ...props }: LanguageToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      data-slot="language-toggle-group"
      variant="outline"
      value={value ? [value] : []}
      onValueChange={(groupValue: string[]) => {
        const picked = groupValue.find((v) => v !== value);
        if (picked) onValueChange(picked);
      }}
      {...props}
    />
  );
}

export { LanguageToggleGroup };
export type { LanguageToggleGroupProps };
