'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { DollarSignIcon } from '@/registry/bases/base-ui/icons/lucide/dollar-sign-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/registry/bases/base-ui/ui/combobox';
import { toggleVariants } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { CHROME_ICON_CLASS, ChromeControl, type AnimatedIconComponent } from '../../document/ui/chrome-icon';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { insertVariable, matchesVariable, variableIcon, variableLabel } from './variable';

export type VariableMenuTriggerProps = ComboboxPrimitive.Trigger.Props & {
  /** An animated icon component, played while the trigger holds the pointer or the focus. */
  icon: AnimatedIconComponent;
  /** Its accessible name and its tooltip. */
  label: string;
};

/**
 * The button that opens a variable picker, drawn as an `EditorToolbar` item is: an icon in the toggle's small
 * size, named by `label` and showing it as a tooltip. Place it inside a `TooltipProvider`, as the toolbar's
 * `end` is.
 */
export function VariableMenuTrigger({ icon, label, className, ...props }: VariableMenuTriggerProps) {
  return (
    <ChromeControl
      icon={icon}
      iconClassName={CHROME_ICON_CLASS}
      render={({ children, ...control }) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <ComboboxPrimitive.Trigger
                data-slot="variable-menu-trigger"
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

export interface VariableMenuProps {
  editor: IEditor;
  declarations: readonly VariableDeclaration[];
  /** Its words; the English when absent. */
  messages?: ProfileEditorMessages;
  className?: string;
}

/** The toolbar's variable picker: a filterable list of the declarations, each inserted at the caret. */
export function VariableMenu({
  editor,
  declarations,
  messages = DEFAULT_PROFILE_MESSAGES,
  className,
}: VariableMenuProps) {
  return (
    <Combobox
      items={declarations as VariableDeclaration[]}
      // A picker, not a field: it keeps no value, so the same variable can be inserted again.
      value={null}
      onValueChange={(declaration: VariableDeclaration | null) => {
        if (!declaration) return;
        insertVariable(editor, declaration.name);
        editor.focus();
      }}
      itemToStringLabel={variableLabel}
      // The same match as the `{{` menu: a label or a name.
      filter={(declaration: VariableDeclaration, query: string) => matchesVariable(declaration, query)}
    >
      <VariableMenuTrigger
        data-slot="variable-menu"
        icon={DollarSignIcon}
        label={messages.variable}
        className={className}
      />
      <ComboboxContent className="w-64">
        <ComboboxInput showTrigger={false} placeholder={messages.findVariable} aria-label={messages.findVariable} />
        <ComboboxEmpty>{messages.noVariables}</ComboboxEmpty>
        <ComboboxList>
          {(declaration: VariableDeclaration) => (
            <ComboboxItem key={declaration.name} value={declaration}>
              {variableIcon(declaration.type)}
              {variableLabel(declaration)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
