'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import type { ReactNode } from 'react';

import { Combobox } from '@/registry/bases/base-ui/ui/combobox';

import { useLanguageOptions } from '@/registry/bases/base-ui/hooks/use-language-options';
import { findLanguageOption } from '@/registry/bases/base-ui/lib/language-options';
import type { LanguageOption, LanguageOptionSource } from '@/registry/bases/base-ui/types/language-option';

type LanguageComboboxProps = LanguageOptionSource &
  Omit<
    ComboboxPrimitive.Root.Props<LanguageOption>,
    'items' | 'value' | 'defaultValue' | 'onValueChange' | 'multiple' | 'itemToStringLabel' | 'isItemEqualToValue'
  > & {
    /** The selected language: a BCP-47 code, or a code-language id (an alias such as `ts` is shown as its language). */
    value: string;
    /** Called with the picked option's `value`; the consumer decides whether to apply it. */
    onValueChange: (value: string) => void;
  };

/**
 * A searchable language picker over upstream's `Combobox`, for UI locales
 * (`kind="locale"`) or code languages (`kind="code"`). The root owns the option
 * set and maps the string `value` to and from its option; the consumer composes
 * every visible part inside it: a `ComboboxTrigger` (holding a `ComboboxValue`,
 * whose render function receives the current `LanguageOption`), and a
 * `ComboboxContent` with an optional `ComboboxInput`, a `ComboboxEmpty` and a
 * `ComboboxList` whose render function receives each `LanguageOption`.
 */
function LanguageCombobox({
  kind = 'locale',
  options,
  locales,
  value,
  onValueChange,
  ...props
}: LanguageComboboxProps): ReactNode {
  const items = useLanguageOptions({ kind, options, locales, value });
  const current = findLanguageOption(items, value, kind);
  return (
    <Combobox
      items={items}
      value={current ?? null}
      onValueChange={(option: LanguageOption | null) => {
        if (option) onValueChange(option.value);
      }}
      itemToStringLabel={(option: LanguageOption) => option.label}
      isItemEqualToValue={(a: LanguageOption, b: LanguageOption) => a?.value === b?.value}
      {...props}
    />
  );
}

export { LanguageCombobox };
export type { LanguageComboboxProps };
