import { ChevronDown } from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * A split-action button: a primary region that runs the default action on the
 * *current* option, plus a separate, always-visible chevron that opens a menu to
 * switch which option is current. The industry split-button pattern (NN/G,
 * Atlassian, PatternFly): one-click access to the common choice while
 * consolidating related variants behind the arrow — used "if the result of
 * clicking the button is an action or selecting a tool". The chevron is
 * persistently rendered and visually separate per NN/G's guidance that the menu
 * signifier must never be hidden. https://www.nngroup.com/articles/split-buttons/
 *
 * Generic over the option value `T` — it knows nothing about the options' domain.
 */
export interface ToolbarOption<T extends string> {
  value: T
  label: string
  icon: ComponentType<{ className?: string }>
  /** Resolved shortcut label (e.g. "W"); rendered as a <Kbd> chip. */
  shortcut?: string
}

export interface SplitButtonProps<T extends string> {
  options: ToolbarOption<T>[]
  /** The currently selected option — drives the primary icon + tooltip. */
  value: T
  /** Whether this group is active — highlights both regions. */
  active?: boolean
  /** Run the default action for the current option (primary click). */
  onPrimary: () => void
  /** Switch the current option (menu item click). */
  onValueChange: (value: T) => void
  dropdownLabel: string
  /** Extra menu content appended after the options. */
  extraItems?: ReactNode
  /** Filter which options appear in the menu (default: all). */
  filter?: (option: ToolbarOption<T>) => boolean
  align?: "start" | "center" | "end"
}

function SplitButton<T extends string>({
  options,
  value,
  active = false,
  onPrimary,
  onValueChange,
  dropdownLabel,
  extraItems,
  filter,
  align = "start",
}: SplitButtonProps<T>) {
  const current = options.find((o) => o.value === value) ?? options[0]
  const CurrentIcon = current.icon
  const items = filter ? options.filter(filter) : options
  const variant = active ? "secondary" : "ghost"

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={variant}
              size="icon"
              onClick={onPrimary}
              aria-label={current.label}
            />
          }
        >
          <CurrentIcon />
        </TooltipTrigger>
        <TooltipContent>
          {current.label}
          {current.shortcut ? (
            <>
              {" "}
              <Kbd>{current.shortcut}</Kbd>
            </>
          ) : null}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button variant={variant} size="icon" aria-label={dropdownLabel} />
                }
              >
                <ChevronDown className="size-2.5" />
              </DropdownMenuTrigger>
            }
          />
          <TooltipContent>{dropdownLabel}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align={align} side="top" className="w-auto">
          {items.map((o) => {
            const Icon = o.icon
            return (
              <DropdownMenuItem key={o.value} onClick={() => onValueChange(o.value)}>
                <Icon className="size-3.5" />
                {o.label}
                {o.shortcut ? (
                  <DropdownMenuShortcut>
                    <Kbd>{o.shortcut}</Kbd>
                  </DropdownMenuShortcut>
                ) : null}
              </DropdownMenuItem>
            )
          })}
          {extraItems}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { SplitButton }
