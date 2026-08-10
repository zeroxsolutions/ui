'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { GlobeIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/registry/bases/base-ui/ui/combobox';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';

import {
  canonicalCodeId,
  codeLanguageOptions,
  localeOptions,
  type LanguageKind,
  type LanguageOption,
} from './language-switcher-data';

export { codeLanguageOptions, localeOptions } from './language-switcher-data';
export type { LanguageKind, LanguageOption } from './language-switcher-data';

/** Props shared by every display form. Controlled: the consumer owns `value`. */
export interface LanguageSwitcherBaseProps {
  /** The selected language's value (a BCP-47 code, or a code-language id). */
  value: string;
  /** Called with the newly-selected value; the consumer decides whether to apply it. */
  onValueChange: (value: string) => void;
  /** Which built-in option set to use when `options` is not supplied. Defaults to `locale`. */
  kind?: LanguageKind;
  /** Explicit options — overrides the built-in `kind` data (bring-your-own). */
  options?: LanguageOption[];
  /** For `kind="locale"` with no `options`: the BCP-47 codes to offer. */
  locales?: readonly string[];
  /** Copy for the search field / trigger placeholder (the consumer owns it). */
  placeholder?: string;
  /** Copy shown when a search matches nothing (the consumer owns it). */
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * The `dropdown` (default) and `icon` forms — both the shipped `Combobox` (a
 * searchable select), differing only by the trigger: a wide labelled button vs.
 * an icon-only button. Both accept `searchable`.
 */
interface ComboboxFormProps extends LanguageSwitcherBaseProps {
  form?: 'dropdown' | 'icon';
  /** Show the search field in the popup. Defaults to `true` for `kind="code"`. */
  searchable?: boolean;
}

/** The `segmented` form shows every option inline — a ToggleGroup, no search field. */
interface SegmentedFormProps extends LanguageSwitcherBaseProps {
  form: 'segmented';
}

/**
 * Props for {@link LanguageSwitcher} — a discriminated union on `form`. The
 * `dropdown`/`icon` forms accept `searchable`; the `segmented` form does not.
 */
export type LanguageSwitcherProps = ComboboxFormProps | SegmentedFormProps;

function useLanguageOptions({
  kind = 'locale',
  options,
  locales,
  value,
}: Pick<
  LanguageSwitcherBaseProps,
  'kind' | 'options' | 'locales' | 'value'
>): LanguageOption[] {
  return React.useMemo(() => {
    if (options) return options;
    if (kind === 'code') return codeLanguageOptions();
    return localeOptions(locales ?? (value ? [value] : []));
  }, [kind, options, locales, value]);
}

/** The option matching `value`, resolving code aliases (`ts` → `typescript`); a bare fallback otherwise. */
function findCurrent(
  options: LanguageOption[],
  value: string,
  kind: LanguageKind,
): LanguageOption | undefined {
  const direct = options.find((o) => o.value === value);
  if (direct) return direct;
  if (kind === 'code') {
    const canonical = canonicalCodeId(value);
    const aliased = options.find((o) => o.value === canonical);
    if (aliased) return aliased;
  }
  return value ? { value, label: value } : undefined;
}

/**
 * The shared body for the dropdown and icon forms — the shipped `Combobox` (a
 * searchable select): the search field lives inside the popup and shows only
 * when `searchable`, the options are a scrollable list, and the selected option
 * carries a check. Each form supplies only its trigger; everything below the
 * trigger is identical.
 */
function LanguageSwitcherCombobox({
  options,
  value,
  onValueChange,
  kind,
  searchable,
  placeholder,
  emptyText,
  disabled,
  trigger,
}: {
  options: LanguageOption[];
  value: string;
  onValueChange: (value: string) => void;
  kind: LanguageKind;
  searchable: boolean;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  trigger: (current: LanguageOption | undefined) => React.ReactNode;
}) {
  // Resolve aliases (`ts` → `typescript`) so the trigger and the checked item
  // reflect the current value even when it is an alias.
  const current = findCurrent(options, value, kind);
  return (
    <Combobox
      items={options}
      value={current ?? null}
      onValueChange={(option) => {
        if (option) onValueChange(option.value);
      }}
      itemToStringLabel={(option: LanguageOption) => option.label}
      isItemEqualToValue={(a: LanguageOption, b: LanguageOption) =>
        a?.value === b?.value
      }
      disabled={disabled}
    >
      {trigger(current)}
      {/* min-w-56 widens the popup past a narrow (icon) trigger; the width still
          tracks the anchor for the wider dropdown trigger. */}
      <ComboboxContent className="min-w-56">
        {searchable && (
          <ComboboxInput
            showTrigger={false}
            placeholder={placeholder ?? 'Search…'}
          />
        )}
        <ComboboxEmpty>{emptyText ?? 'No results.'}</ComboboxEmpty>
        <ComboboxList>
          {(option: LanguageOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon}
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * The dropdown form: a wide labelled trigger (current language + chevron) opening
 * the shared `Combobox`. Searchable by default for `kind="code"`.
 */
function LanguageSwitcherDropdown({
  kind = 'locale',
  searchable,
  placeholder,
  emptyText,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...rest
}: Omit<ComboboxFormProps, 'form'>) {
  const options = useLanguageOptions({ kind, ...rest });
  const isSearchable = searchable ?? kind === 'code';
  return (
    <LanguageSwitcherCombobox
      options={options}
      value={rest.value}
      onValueChange={rest.onValueChange}
      kind={kind}
      searchable={isSearchable}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      trigger={(current) => (
        // ComboboxTrigger appends the chevron itself — the dropdown affordance.
        <ComboboxTrigger
          render={<Button variant="outline" size="sm" disabled={disabled} />}
          aria-label={ariaLabel ?? 'Select language'}
          className={className}
        >
          {current?.icon}
          <span>{current?.label ?? placeholder ?? 'Select…'}</span>
        </ComboboxTrigger>
      )}
    />
  );
}

/**
 * The icon form: an icon-only trigger (the current language's icon, or a globe)
 * opening the same shared `Combobox`. Compact — for a header or toolbar.
 */
function LanguageSwitcherIcon({
  kind = 'locale',
  searchable,
  placeholder,
  emptyText,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...rest
}: Omit<ComboboxFormProps, 'form'>) {
  const options = useLanguageOptions({ kind, ...rest });
  const isSearchable = searchable ?? kind === 'code';
  return (
    <LanguageSwitcherCombobox
      options={options}
      value={rest.value}
      onValueChange={rest.onValueChange}
      kind={kind}
      searchable={isSearchable}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      trigger={(current) => (
        // The design-system `ComboboxTrigger` always appends a chevron, which
        // would crowd an icon-only button; use the primitive trigger directly
        // (switch, don't patch) so the icon form stays a single glyph.
        <ComboboxPrimitive.Trigger
          render={<Button variant="ghost" size="icon" disabled={disabled} />}
          aria-label={ariaLabel ?? 'Select language'}
          className={className}
        >
          {current?.icon ?? <GlobeIcon />}
        </ComboboxPrimitive.Trigger>
      )}
    />
  );
}

/**
 * The segmented form: every option shown inline as a single-select toggle group.
 * Best for a small, fixed set (2–4 languages). No search — all options are visible.
 */
function LanguageSwitcherSegmented({
  kind = 'locale',
  disabled,
  className,
  'aria-label': ariaLabel,
  ...rest
}: LanguageSwitcherBaseProps) {
  const options = useLanguageOptions({ kind, ...rest });
  const { value, onValueChange } = rest;
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(groupValue: string[]) => {
        const picked = groupValue.find((v) => v !== value);
        if (picked) onValueChange(picked);
      }}
      variant="outline"
      spacing={0}
      disabled={disabled}
      aria-label={ariaLabel ?? 'Select language'}
      className={className}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="gap-2"
        >
          {option.icon}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * A controlled, i18n-agnostic language selector. Pick a display form with the
 * `form` prop — `"dropdown"` (default), `"segmented"`, or `"icon"` — and the
 * domain with `kind` (`"locale"` for UI locales, `"code"` for programming
 * languages, which carry Material file-type icons). `searchable` applies to the
 * `dropdown`/`icon` forms only (the `segmented` form shows every option inline).
 * The consumer owns `value` and every visible string; pass `options` to override
 * the built-in `kind` data.
 */
export function LanguageSwitcher({
  form = 'dropdown',
  ...rest
}: LanguageSwitcherProps) {
  if (form === 'segmented') return <LanguageSwitcherSegmented {...rest} />;
  if (form === 'icon') return <LanguageSwitcherIcon {...rest} />;
  return <LanguageSwitcherDropdown {...rest} />;
}
