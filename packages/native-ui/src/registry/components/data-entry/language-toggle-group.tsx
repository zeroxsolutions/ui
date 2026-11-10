import type { ComponentProps, ReactNode } from 'react';
import { ToggleGroup } from '../../ui/toggle-group';

type LanguageToggleGroupProps = Omit<ComponentProps<typeof ToggleGroup>, 'type' | 'value' | 'onValueChange'> & {
  /** The selected language's value; the item whose `value` equals it is checked. */
  value: string;
  /** Called with a newly pressed item's `value`. Pressing the current item reports nothing. */
  onValueChange: (value: string) => void;
};

/**
 * Every language shown inline as a single-choice toggle group, announced as a radio group, for a small fixed
 * set (two to four). Compose one `ToggleGroupItem` per option as its direct children; the group never
 * deselects, so a language is always chosen. Outlined, at the toggle group's default spacing, unless `variant`
 * or `spacing` say otherwise.
 */
function LanguageToggleGroup({ value, onValueChange, ...props }: LanguageToggleGroupProps): ReactNode {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(picked) => {
        if (picked) onValueChange(picked);
      }}
      {...props}
    />
  );
}

export { LanguageToggleGroup };
export type { LanguageToggleGroupProps };
