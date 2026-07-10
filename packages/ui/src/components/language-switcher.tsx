"use client"

import * as React from "react"
import { GlobeIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  canonicalCodeId,
  codeLanguageOptions,
  localeOptions,
  type LanguageKind,
  type LanguageOption,
} from "./language-switcher-data"

export type { LanguageKind, LanguageOption } from "./language-switcher-data"
export { codeLanguageOptions, localeOptions } from "./language-switcher-data"

/** Props shared by every display form. Controlled: the consumer owns `value`. */
export interface LanguageSwitcherBaseProps {
  /** The selected language's value (a BCP-47 code, or a code-language id). */
  value: string
  /** Called with the newly-selected value; the consumer decides whether to apply it. */
  onValueChange: (value: string) => void
  /** Which built-in option set to use when `options` is not supplied. Defaults to `locale`. */
  kind?: LanguageKind
  /** Explicit options — overrides the built-in `kind` data (bring-your-own). */
  options?: LanguageOption[]
  /** For `kind="locale"` with no `options`: the BCP-47 codes to offer. */
  locales?: readonly string[]
  /** Copy for the search field / trigger placeholder (the consumer owns it). */
  placeholder?: string
  /** Copy shown when a search matches nothing (the consumer owns it). */
  emptyText?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

interface SearchableProps extends LanguageSwitcherBaseProps {
  /** Show a filter field in the popup. Defaults to `true` for `kind="code"`. */
  searchable?: boolean
}

function useLanguageOptions({
  kind = "locale",
  options,
  locales,
  value,
}: Pick<
  LanguageSwitcherBaseProps,
  "kind" | "options" | "locales" | "value"
>): LanguageOption[] {
  return React.useMemo(() => {
    if (options) return options
    if (kind === "code") return codeLanguageOptions()
    return localeOptions(locales ?? (value ? [value] : []))
  }, [kind, options, locales, value])
}

/** The option matching `value`, resolving code aliases (`ts` → `typescript`); a bare fallback otherwise. */
function findCurrent(
  options: LanguageOption[],
  value: string,
  kind: LanguageKind,
): LanguageOption | undefined {
  const direct = options.find((o) => o.value === value)
  if (direct) return direct
  if (kind === "code") {
    const canonical = canonicalCodeId(value)
    const aliased = options.find((o) => o.value === canonical)
    if (aliased) return aliased
  }
  return value ? { value, label: value } : undefined
}

/** The Combobox body shared by the dropdown and icon forms; the trigger is supplied per form. */
function ComboboxBody({
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
  options: LanguageOption[]
  value: string
  onValueChange: (value: string) => void
  kind: LanguageKind
  searchable: boolean
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  trigger: (current: LanguageOption | undefined) => React.ReactNode
}) {
  const current = findCurrent(options, value, kind)
  return (
    <Combobox
      items={options}
      value={current ?? null}
      onValueChange={(next: LanguageOption | null) => {
        if (next) onValueChange(next.value)
      }}
      itemToStringLabel={(item: LanguageOption) => item.label}
      isItemEqualToValue={(a: LanguageOption, b: LanguageOption) =>
        a.value === b.value
      }
      disabled={disabled}
    >
      {trigger(current)}
      <ComboboxContent>
        {searchable && <ComboboxInput placeholder={placeholder ?? "Search…"} />}
        <ComboboxEmpty>{emptyText ?? "No results."}</ComboboxEmpty>
        <ComboboxList>
          {options.map((option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon}
              <span className="truncate">{option.label}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

/**
 * The dropdown form: a trigger showing the current language that opens a menu of
 * options. Searchable (a filter field in the popup) by default for `kind="code"`.
 */
function LanguageSwitcherDropdown({
  kind = "locale",
  searchable,
  placeholder,
  emptyText,
  disabled,
  className,
  "aria-label": ariaLabel,
  ...rest
}: SearchableProps) {
  const options = useLanguageOptions({ kind, ...rest })
  const isSearchable = searchable ?? kind === "code"
  return (
    <ComboboxBody
      options={options}
      value={rest.value}
      onValueChange={rest.onValueChange}
      kind={kind}
      searchable={isSearchable}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      trigger={(current) => (
        <ComboboxTrigger
          render={<Button variant="outline" size="sm" disabled={disabled} />}
          aria-label={ariaLabel ?? "Select language"}
          className={cn("min-w-40 justify-between gap-2 font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {current?.icon}
            <span className="truncate">
              {current?.label ?? placeholder ?? "Select…"}
            </span>
          </span>
        </ComboboxTrigger>
      )}
    />
  )
}

/**
 * The icon form: an icon-only trigger (the current language's icon, or a globe)
 * that opens the same menu. Compact — for a header or a code-block toolbar.
 */
function LanguageSwitcherIcon({
  kind = "locale",
  searchable,
  placeholder,
  emptyText,
  disabled,
  className,
  "aria-label": ariaLabel,
  ...rest
}: SearchableProps) {
  const options = useLanguageOptions({ kind, ...rest })
  const isSearchable = searchable ?? kind === "code"
  return (
    <ComboboxBody
      options={options}
      value={rest.value}
      onValueChange={rest.onValueChange}
      kind={kind}
      searchable={isSearchable}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      trigger={(current) => (
        <ComboboxTrigger
          render={<Button variant="ghost" size="icon" disabled={disabled} />}
          aria-label={ariaLabel ?? "Select language"}
          className={cn("gap-1", className)}
        >
          {current?.icon ?? <GlobeIcon className="size-4" />}
        </ComboboxTrigger>
      )}
    />
  )
}

/**
 * The segmented form: every option shown inline as a single-select toggle group.
 * Best for a small, fixed set (2–4 languages). No search — all options are visible.
 */
function LanguageSwitcherSegmented({
  kind = "locale",
  disabled,
  className,
  "aria-label": ariaLabel,
  ...rest
}: LanguageSwitcherBaseProps) {
  const options = useLanguageOptions({ kind, ...rest })
  const { value, onValueChange } = rest
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(groupValue: string[]) => {
        const picked = groupValue.find((v) => v !== value)
        if (picked) onValueChange(picked)
      }}
      variant="outline"
      spacing={0}
      disabled={disabled}
      aria-label={ariaLabel ?? "Select language"}
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
          <span>{option.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/**
 * A controlled, i18n-agnostic language selector. Choose a display form through a
 * compound sub-component — `LanguageSwitcher.Dropdown`, `.Segmented`, `.Icon` —
 * and the domain through `kind` (`"locale"` for UI locales, `"code"` for
 * programming languages, which carry Material file-type icons). Bare
 * `LanguageSwitcher` renders the dropdown form. The consumer owns `value` and
 * every visible string; pass `options` to override the built-in `kind` data.
 */
const LanguageSwitcher = LanguageSwitcherDropdown as typeof LanguageSwitcherDropdown & {
  Dropdown: typeof LanguageSwitcherDropdown
  Segmented: typeof LanguageSwitcherSegmented
  Icon: typeof LanguageSwitcherIcon
}
LanguageSwitcher.Dropdown = LanguageSwitcherDropdown
LanguageSwitcher.Segmented = LanguageSwitcherSegmented
LanguageSwitcher.Icon = LanguageSwitcherIcon

export { LanguageSwitcher }
