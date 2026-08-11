import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * MenuButton - a "remembered default" split control: the primary repeats the
 * currently-selected action, and the caret opens a menu that *changes which
 * action is current* (it does not fire it). Picking "Allow all" arms it as the
 * primary; the user then clicks the primary to run it - the GitHub-merge / VS
 * Code Run pattern. Contrast `SplitButton`, whose primary is a fixed default and
 * whose menu items fire immediately.
 *
 * Compound, not a prop-bag - the consumer owns the current `value` and threads it
 * to both the primary (its label + action) and the radio group:
 *
 *   <MenuButton>
 *     <MenuButtonAction onClick={() => run(value)}>{labelOf(value)}</MenuButtonAction>
 *     <MenuButtonMenu>
 *       <MenuButtonTrigger aria-label="Change action" />
 *       <MenuButtonContent>
 *         <MenuButtonRadioGroup value={value} onValueChange={setValue}>
 *           <MenuButtonRadioItem value="once">Allow once</MenuButtonRadioItem>
 *           <MenuButtonRadioItem value="all">Allow all</MenuButtonRadioItem>
 *         </MenuButtonRadioGroup>
 *       </MenuButtonContent>
 *     </MenuButtonMenu>
 *   </MenuButton>
 *
 * Built on `ButtonGroup` (one seamed control); the caret's open state and the
 * current-selection state both ride the Base UI `DropdownMenu` + its radio group
 * - no hand-rolled context. The primary and caret share a matched `variant`.
 */
function MenuButton({
  className,
  ...props
}: ComponentProps<typeof ButtonGroup>) {
  return <ButtonGroup className={className} {...props} />;
}

/** The primary segment - repeats the current action; its label reflects `value`. */
function MenuButtonAction({
  variant = 'outline',
  ...props
}: ComponentProps<typeof Button>) {
  return <Button data-slot="menu-button-action" variant={variant} {...props} />;
}

/**
 * The menu wrapper - the Base UI `DropdownMenu` owning open + selection state.
 * Forwarder kept as the compound's named part for this slot.
 */
function MenuButtonMenu(props: ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu {...props} />;
}

/** The caret segment - opens the menu that changes the current action. */
function MenuButtonTrigger({
  variant = 'outline',
  size = 'icon',
  'aria-label': ariaLabel = 'Change action',
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <DropdownMenuTrigger
      render={
        <Button
          data-slot="menu-button-trigger"
          variant={variant}
          size={size}
          aria-label={ariaLabel}
          {...props}
        />
      }
    >
      {children ?? <ChevronDown />}
    </DropdownMenuTrigger>
  );
}

/** The dropdown surface; sizes to its content so labels don't wrap. */
function MenuButtonContent({
  align = 'end',
  className,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      align={align}
      className={cn('w-auto', className)}
      {...props}
    />
  );
}

/**
 * The current-selection group - `value` + `onValueChange` set the default.
 * Forwarder kept as the compound's named part for this slot.
 */
function MenuButtonRadioGroup(
  props: ComponentProps<typeof DropdownMenuRadioGroup>,
) {
  return <DropdownMenuRadioGroup {...props} />;
}

/**
 * One selectable default; the checked one is the current action.
 * Forwarder kept as the compound's named part for this slot.
 */
function MenuButtonRadioItem(
  props: ComponentProps<typeof DropdownMenuRadioItem>,
) {
  return <DropdownMenuRadioItem {...props} />;
}

export {
  MenuButton,
  MenuButtonAction,
  MenuButtonMenu,
  MenuButtonTrigger,
  MenuButtonContent,
  MenuButtonRadioGroup,
  MenuButtonRadioItem,
};
