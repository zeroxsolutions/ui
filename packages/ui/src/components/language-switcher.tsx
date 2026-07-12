'use client';

import { ChevronDownIcon, GlobeIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
 * The `dropdown` (default) and `icon` forms — both a `Popover` + `Command` (a
 * clean search field over a scrollable list), differing only by the trigger: a
 * wide labelled button vs. an icon-only button. Both accept `searchable`.
 */
interface PopoverFormProps extends LanguageSwitcherBaseProps {
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
export type LanguageSwitcherProps = PopoverFormProps | SegmentedFormProps;

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
 * The shared Popover + Command body for the dropdown and icon forms — shadcn's
 * standard combobox recipe: a clean `CommandInput` over a scrollable `CommandList`
 * (no native scrollbar) inside a `Popover` that owns its own width. Each form only
 * supplies its trigger; everything below the trigger is identical.
 */
function LanguageSwitcherPopover({
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
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {trigger(current)}
      <PopoverContent align="start" className="p-0">
        <Command>
          {searchable && (
            <CommandInput placeholder={placeholder ?? 'Search…'} />
          )}
          <CommandList>
            <CommandEmpty>{emptyText ?? 'No results.'}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  data-checked={
                    current?.value === option.value ? 'true' : undefined
                  }
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  disabled={disabled}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The dropdown form: a wide labelled trigger (current language + chevron) opening
 * the shared Popover + Command. Searchable by default for `kind="code"`.
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
}: Omit<PopoverFormProps, 'form'>) {
  const options = useLanguageOptions({ kind, ...rest });
  const isSearchable = searchable ?? kind === 'code';
  return (
    <LanguageSwitcherPopover
      options={options}
      value={rest.value}
      onValueChange={rest.onValueChange}
      kind={kind}
      searchable={isSearchable}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      trigger={(current) => (
        <PopoverTrigger
          render={<Button variant="outline" size="sm" disabled={disabled} />}
          aria-label={ariaLabel ?? 'Select language'}
          className={className}
        >
          {current?.icon}
          <span>{current?.label ?? placeholder ?? 'Select…'}</span>
          <ChevronDownIcon />
        </PopoverTrigger>
      )}
    />
  );
}

/**
 * The icon form: an icon-only trigger (the current language's icon, or a globe)
 * opening the same shared Popover + Command. Compact — for a header or toolbar.
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
}: Omit<PopoverFormProps, 'form'>) {
  const options = useLanguageOptions({ kind, ...rest });
  const isSearchable = searchable ?? kind === 'code';
  return (
    <LanguageSwitcherPopover
      options={options}
      value={rest.value}
      onValueChange={rest.onValueChange}
      kind={kind}
      searchable={isSearchable}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      trigger={(current) => (
        <PopoverTrigger
          render={<Button variant="ghost" size="icon" disabled={disabled} />}
          aria-label={ariaLabel ?? 'Select language'}
          className={className}
        >
          {current?.icon ?? <GlobeIcon />}
        </PopoverTrigger>
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
