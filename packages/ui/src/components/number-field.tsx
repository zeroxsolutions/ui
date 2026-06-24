import { useCallback, useState, type ReactNode } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * Tiny recursive-descent evaluator for simple arithmetic so a field accepts
 * `100 + 8` / `(4 + 2) * 3` and commits the result. Supports `+ - * /`,
 * parentheses and decimals; returns null for anything else.
 */
function evaluateExpression(expr: string): number | null {
  const trimmed = expr.trim()
  if (!trimmed) return null
  // Only digits, decimal points, whitespace and the basic operators.
  if (!/^[\d\s.+\-*/()]+$/.test(trimmed)) return null
  try {
    let pos = 0
    const peek = () => trimmed[pos]
    const consume = (ch: string) => {
      if (trimmed[pos] !== ch) throw new Error("unexpected")
      pos++
    }

    function skipWs() {
      while (pos < trimmed.length && trimmed[pos] === " ") pos++
    }

    function parseNumber(): number {
      skipWs()
      const start = pos
      if (trimmed[pos] === "-" || trimmed[pos] === "+") pos++
      while (
        pos < trimmed.length &&
        ((trimmed[pos] >= "0" && trimmed[pos] <= "9") || trimmed[pos] === ".")
      )
        pos++
      if (pos === start) throw new Error("expected number")
      return Number(trimmed.slice(start, pos))
    }

    function parsePrimary(): number {
      skipWs()
      if (peek() === "(") {
        consume("(")
        const val = parseAddSub()
        skipWs()
        consume(")")
        return val
      }
      return parseNumber()
    }

    function parseMulDiv(): number {
      let left = parsePrimary()
      skipWs()
      while (pos < trimmed.length && (peek() === "*" || peek() === "/")) {
        const op = peek()
        pos++
        const right = parsePrimary()
        left = op === "*" ? left * right : left / right
        skipWs()
      }
      return left
    }

    function parseAddSub(): number {
      let left = parseMulDiv()
      skipWs()
      while (pos < trimmed.length && (peek() === "+" || peek() === "-")) {
        const op = peek()
        pos++
        const right = parseMulDiv()
        left = op === "+" ? left + right : left - right
        skipWs()
      }
      return left
    }

    const result = parseAddSub()
    skipWs()
    if (pos !== trimmed.length) return null
    if (typeof result !== "number" || !isFinite(result)) return null
    return result
  } catch {
    return null
  }
}

export interface NumberFieldProps {
  /** Leading label addon (e.g. "X", "W"). */
  label?: ReactNode
  value: number
  onValueChange: (value: number) => void
  disabled?: boolean
  min?: number
  max?: number
  /**
   * Advisory step size for the value. Currently informational — the field
   * commits typed/arithmetic input rather than native stepping; keyboard
   * increment is not yet wired.
   */
  step?: number
  /** Trailing unit addon (e.g. "px", "°"). */
  suffix?: ReactNode
  /** Override raw parsing — receives the draft string, returns a number or null. */
  parseRaw?: (raw: string) => number | null
  /** A second trailing addon after `suffix` (e.g. a popover trigger). */
  endAddon?: ReactNode
  className?: string
  /**
   * Multi-selection with differing values — blanks the value and shows
   * `placeholder` until the user types one, which then applies to every
   * selected target.
   */
  mixed?: boolean
  /** Placeholder shown while `mixed` (the consumer owns the copy, e.g. "Mixed"). */
  placeholder?: string
  /**
   * Show this text in place of the numeric value while not editing (e.g. a
   * "Hug" / "Fill" sizing label). Focusing clears it so typing commits a number.
   */
  displayText?: string
}

/**
 * A compact numeric field for a property inspector: an `InputGroup` with an
 * optional label addon, a value input that accepts arithmetic expressions and
 * clamps to `min`/`max`, and optional unit/`endAddon` trailing slots. Controlled
 * — the consumer owns the number and supplies any placeholder copy.
 */
function NumberField({
  label,
  value,
  onValueChange,
  disabled,
  min,
  max,
  suffix,
  parseRaw,
  endAddon,
  className,
  mixed,
  placeholder,
  displayText,
}: NumberFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const handleFocus = useCallback(() => {
    setEditing(true)
    setDraft(mixed || displayText ? "" : String(value))
  }, [value, mixed, displayText])

  const commit = useCallback(() => {
    setEditing(false)
    const result = parseRaw ? parseRaw(draft) : evaluateExpression(draft)
    if (result !== null) {
      let clamped = result
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      onValueChange(clamped)
    }
  }, [draft, min, max, onValueChange, parseRaw])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur()
      } else if (e.key === "Escape") {
        setEditing(false)
        setDraft(String(value))
        e.currentTarget.blur()
      }
    },
    [value],
  )

  return (
    <InputGroup className={className} data-disabled={disabled || undefined}>
      {label && <InputGroupAddon>{label}</InputGroupAddon>}
      <InputGroupInput
        type="text"
        inputMode="decimal"
        value={editing ? draft : mixed ? "" : (displayText ?? value)}
        placeholder={mixed && !editing ? placeholder : undefined}
        onChange={(e) => {
          if (editing) {
            setDraft(e.target.value)
          } else {
            onValueChange(Number(e.target.value))
          }
        }}
        onFocus={handleFocus}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="tabular-nums"
      />
      {suffix && <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon>}
      {endAddon && <InputGroupAddon align="inline-end">{endAddon}</InputGroupAddon>}
    </InputGroup>
  )
}

export { NumberField }
