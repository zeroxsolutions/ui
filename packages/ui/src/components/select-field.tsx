import type * as React from "react"
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

export interface SelectFieldProps
  extends Omit<React.ComponentProps<typeof InputGroup>, "onChange" | "children"> {
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
 * optional label addon and a `Select` rendered with the `borderless` trigger
 * variant so the group provides the single outer chrome. Controlled — the
 * consumer owns the value and supplies any placeholder copy.
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
  ...props
}: SelectFieldProps) {
  return (
    <InputGroup
      className={className}
      data-disabled={disabled || undefined}
      {...props}
    >
      {label && <InputGroupAddon>{label}</InputGroupAddon>}
      <Select
        value={mixed ? "" : value}
        onValueChange={(v) => onValueChange(v ?? "")}
      >
        <SelectTrigger variant="borderless" disabled={disabled} className="flex-1">
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
