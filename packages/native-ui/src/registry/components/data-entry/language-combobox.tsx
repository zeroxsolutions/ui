import { useMemo, type ReactNode } from 'react';
import { useLanguageOptions } from '../../hooks/use-language-options';
import { findLanguageOption } from '../../lib/language-options';
import type { LanguageOptionSource } from '../../lib/language-options';
import { Combobox, type ComboboxProps } from '../../ui/combobox';

type LanguageComboboxProps = LanguageOptionSource &
  Omit<ComboboxProps, 'items' | 'value' | 'defaultValue' | 'onValueChange' | 'multiple'> & {
    /** The selected language: a BCP-47 code, or a code-language id (an alias such as `ts` is shown as its language). */
    value: string;
    /** Called with the picked option's `value`; the caller decides whether to apply it. */
    onValueChange: (value: string) => void;
  };

/**
 * A searchable language picker over the Combobox, for UI locales (`kind="locale"`) or code languages
 * (`kind="code"`). The root owns the option set and hands the Combobox each option's `value` and `label`, with
 * the option `value` resolves to (an alias's canonical id) as the chosen value; the caller composes every
 * visible part inside it: a ComboboxTrigger holding a ComboboxValue, and a ComboboxContent with an optional
 * ComboboxInput, a ComboboxEmpty and a ComboboxList whose function child is given each option's `value` and
 * `label`. An option's `icon` is not handed on: draw it from your own `options` by value, before a Text label
 * in a ComboboxItem, or in a ComboboxValue's function child.
 */
function LanguageCombobox({
  kind = 'locale',
  options,
  locales,
  value,
  onValueChange,
  ...props
}: LanguageComboboxProps): ReactNode {
  const offered = useLanguageOptions({ kind, options, locales, value });
  const items = useMemo(() => offered.map((option) => ({ value: option.value, label: option.label })), [offered]);
  const current = findLanguageOption(offered, value, kind);
  return <Combobox items={items} value={current?.value ?? null} onValueChange={onValueChange} {...props} />;
}

export { LanguageCombobox };
export type { LanguageComboboxProps };
