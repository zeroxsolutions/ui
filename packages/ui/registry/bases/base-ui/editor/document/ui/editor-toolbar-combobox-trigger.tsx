'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { toggleVariants } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { ChromeControl, type AnimatedIconComponent } from './chrome-icon';

export type EditorToolbarComboboxTriggerProps = ComboboxPrimitive.Trigger.Props & {
  /** An animated icon component, played while the trigger holds the pointer or the focus. */
  icon: AnimatedIconComponent;
  /** Its accessible name and its tooltip. */
  label: string;
};

/**
 * The trigger of a `Combobox` placed in `EditorToolbar`'s `end`, drawn as the toolbar's items are: an icon in the
 * toggle's small size, named by `label` and showing it as a tooltip. Render it inside the `Combobox` it opens.
 */
export function EditorToolbarComboboxTrigger({ icon, label, className, ...props }: EditorToolbarComboboxTriggerProps) {
  return (
    <ChromeControl
      icon={icon}
      iconSized="toolbar"
      render={({ children, ...control }) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <ComboboxPrimitive.Trigger
                data-slot="editor-toolbar-combobox-trigger"
                className={cn(toggleVariants({ size: 'sm' }), className)}
                // A combobox takes no name from its content.
                aria-label={label}
                {...props}
                {...control}
              />
            }
          >
            {children}
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}
