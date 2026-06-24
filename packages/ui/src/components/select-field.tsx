import type { ReactNode } from "react"

import { InputGroup, InputGroupAddon } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SelectFieldOption {
  label: string
  value: string
  icon?: ReactNode
}

export interface SelectFieldProps {
  /** Leading label addon (e.g. "Align", "Type"). */
  label?: ReactNode
  value: string
  onValueChange: (value: string) => void
  options: SelectFieldOption[]
  disabled?: boolean
  /** Trailing addon after the select (e.g. a popover trigger). */
  endAddon?: ReactNode
  className?: string
  /**
   * Multi-selection with differing values — clears the selection and shows
   * `placeholder` until the user picks one, which then applies to every
   * selected target.
   */
  mixed?: boolean
  /** Placeholder shown while `mixed` (the consumer owns the copy, e.g. "Mixed"). */
  placeholder?: string
}

/**
 * A compact labelled select for a property inspector: an `InputGroup` with an
 * optional label addon and a `Select` whose own border/background/ring are
 * stripped so the group provides the single outer chrome (the SDK Select has no
 * borderless variant, so this is an internal override, not a consumer re-chrome).
 * Controlled — the consumer owns the value and supplies any placeholder copy.
 */
function SelectField({
  label,
  value,
  onValueChange,
  options,
  disabled,
  endAddon,
  className,
  mixed,
  placeholder,
}: SelectFieldProps) {
  return (
    <InputGroup className={className} data-disabled={disabled || undefined}>
      {label && <InputGroupAddon>{label}</InputGroupAddon>}
      <Select
        value={mixed ? "" : value}
        onValueChange={(v) => onValueChange(v ?? "")}
      >
        <SelectTrigger
          disabled={disabled}
          // Strip the trigger's own chrome — the InputGroup owns the outer
          // border/background, and the SDK Select has no borderless variant.
          className="flex-1 border-0 !bg-transparent shadow-none ring-0 outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none hover:!bg-transparent dark:!bg-transparent dark:hover:!bg-transparent"
        >
          <SelectValue placeholder={mixed ? placeholder : undefined} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center gap-1.5">
                {opt.icon}
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {endAddon && (
        <InputGroupAddon align="inline-end">{endAddon}</InputGroupAddon>
      )}
    </InputGroup>
  )
}

export { SelectField }
