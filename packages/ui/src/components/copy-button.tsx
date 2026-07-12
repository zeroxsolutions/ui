"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

const COPY_RESET_MS = 2000

export interface CopyButtonProps
  extends Omit<
    React.ComponentProps<typeof Button>,
    "value" | "onClick" | "children"
  > {
  /** Text written to the clipboard on click. */
  value: string
  /** Accessible name in the idle state. */
  label?: string
  /** Accessible name shown briefly after a successful copy. */
  copiedLabel?: string
  /** How long the copied state persists, in ms. */
  timeout?: number
  /** Called with the value after a successful copy. */
  onCopied?: (value: string) => void
}

/**
 * A copy-to-clipboard icon button with transient feedback: on a successful copy
 * it swaps its icon to a check and its accessible name to "Copied" for `timeout`
 * ms, then resets. Defaults to a `ghost` `icon-xs` button, and every `Button`
 * prop (`variant`, `size`, `className`, `disabled`, …) passes through — so it
 * drops into a code-block header, a toolbar, or a card corner unchanged. Clipboard
 * writes are best-effort (a denied permission is swallowed).
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  timeout = COPY_RESET_MS,
  onCopied,
  variant = "ghost",
  size = "icon-xs",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  React.useEffect(() => () => clearTimeout(timer.current), [])

  const copy = React.useCallback(() => {
    if (!navigator?.clipboard?.writeText) return
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), timeout)
        onCopied?.(value)
      })
      .catch(() => {
        /* best-effort — clipboard may be denied */
      })
  }, [value, timeout, onCopied])

  const Icon = copied ? Check : Copy

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
      {...props}
    >
      <Icon />
    </Button>
  )
}
