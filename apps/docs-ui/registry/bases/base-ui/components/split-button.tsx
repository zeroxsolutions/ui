import { ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"

import { Button } from "@/registry/bases/base-ui/ui/button"
import { ButtonGroup } from "@/registry/bases/base-ui/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/bases/base-ui/ui/dropdown-menu"
import { cn } from "@/registry/bases/base-ui/lib/utils"

/**
 * SplitButton - a single divided control: a primary action segment plus a caret
 * segment that opens a menu of related variants of that action. Built by
 * composing the design-system `ButtonGroup`, so the two segments share one
 * rounded outline with a seam (outer corners rounded, inner squared) instead of
 * reading as two loose buttons. The classic split-button pattern (NN/G,
 * Atlassian, PatternFly): one-click access to the safe default while
 * consolidating related choices behind the arrow.
 * https://www.nngroup.com/articles/split-buttons/
 *
 * Compound, not a prop-bag - the consumer composes the parts, so it can inject a
 * control the author never foresaw:
 *
 *   <SplitButton>
 *     <SplitButtonAction onClick={allowOnce}>Allow once</SplitButtonAction>
 *     <SplitButtonMenu>
 *       <SplitButtonTrigger aria-label="More allow options" />
 *       <SplitButtonContent>
 *         <SplitButtonItem onClick={allowSession}>Allow this session</SplitButtonItem>
 *         <SplitButtonItem onClick={allowAlways}>Always allow</SplitButtonItem>
 *       </SplitButtonContent>
 *     </SplitButtonMenu>
 *   </SplitButton>
 *
 * The caret's open state rides the Base UI `DropdownMenu`; the two segments share
 * a matched `variant`/`size` (defaulting to `outline`, whose border is the seam),
 * and `ButtonGroup` joins them. Because Base UI `Menu.Root` renders no DOM, the
 * action and the caret stay adjacent group children - so the group's seam
 * selectors apply - while the menu content portals out of flow. The primary
 * segment can carry a label or an icon; it is not restricted to icon-only.
 *
 * Semantics are classic: the primary runs a fixed action, and each item runs its
 * own related-variant handler - not a remembered-default toggle.
 */
function SplitButton({
  className,
  ...props
}: ComponentProps<typeof ButtonGroup>) {
  return <ButtonGroup className={className} {...props} />
}

/** The primary action segment - a `Button`; label or icon as children. */
function SplitButtonAction({
  variant = "outline",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button data-slot="split-button-action" variant={variant} {...props} />
  )
}

/**
 * The menu wrapper - the Base UI `DropdownMenu` that owns the caret's open state.
 * Forwarder kept as the compound's named part for this slot.
 */
function SplitButtonMenu(props: ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu {...props} />
}

/**
 * The caret segment - a `Button` rendered as the menu trigger via Base UI
 * `render`. Defaults its glyph to a chevron; matched to the action's variant.
 */
function SplitButtonTrigger({
  variant = "outline",
  size = "icon",
  "aria-label": ariaLabel = "More options",
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <DropdownMenuTrigger
      render={
        <Button
          data-slot="split-button-trigger"
          variant={variant}
          size={size}
          aria-label={ariaLabel}
          {...props}
        />
      }
    >
      {children ?? <ChevronDown />}
    </DropdownMenuTrigger>
  )
}

/**
 * The dropdown surface holding the variant items; anchored to the caret. Sizes
 * to its content (`w-auto`) rather than the narrow caret's `--anchor-width`, so
 * item labels don't wrap; still bounded by the menu's own `min-w-32`.
 */
function SplitButtonContent({
  align = "end",
  className,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      align={align}
      className={cn("w-auto", className)}
      {...props}
    />
  )
}

/**
 * One related-variant item; supply its own `onClick`.
 * Forwarder kept as the compound's named part for this slot.
 */
function SplitButtonItem(props: ComponentProps<typeof DropdownMenuItem>) {
  return <DropdownMenuItem {...props} />
}

export {
  SplitButton,
  SplitButtonAction,
  SplitButtonMenu,
  SplitButtonTrigger,
  SplitButtonContent,
  SplitButtonItem,
}
