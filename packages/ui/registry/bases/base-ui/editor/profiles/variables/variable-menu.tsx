'use client';

import { BracesIcon } from '@/registry/bases/base-ui/icons/lucide/braces-icon';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/registry/bases/base-ui/ui/combobox';
import { useRef } from 'react';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { EditorToolbarComboboxTrigger } from '../../document/ui/editor-toolbar-combobox-trigger';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { insertVariable, matchesVariable, variableIcon, variableLabel } from './variable';
import { variableTextFieldOf } from './variable-text-field';

export interface VariableMenuProps {
  editor: IEditor;
  declarations: readonly VariableDeclaration[];
  /** Its words; the English when absent. */
  messages?: ProfileEditorMessages;
  /** Refuses to open, as while the editor is out of sight. */
  disabled?: boolean;
  className?: string;
}

/**
 * The toolbar's variable picker: a filterable list of the declarations, each inserted at the caret. When a
 * variable text field held the focus as the picker was reached, such as a button's label, the variable goes
 * into that field instead of `editor`.
 */
export function VariableMenu({
  editor,
  declarations,
  messages = DEFAULT_PROFILE_MESSAGES,
  disabled,
  className,
}: VariableMenuProps) {
  // The field the focus came straight from as the picker took it: a press reads the element it takes the focus
  // from, the keyboard the element it came from. Forgotten after a pick and once the list has closed, so a later
  // pick never lands in a field the author has since left.
  const field = useRef<IEditor | null>(null);
  const reach = (from: Element | null) => {
    field.current = variableTextFieldOf(from);
  };
  return (
    <Combobox
      items={declarations as VariableDeclaration[]}
      // A picker, not a field: it keeps no value, so the same variable can be inserted again.
      value={null}
      disabled={disabled}
      onValueChange={(declaration: VariableDeclaration | null) => {
        if (!declaration) return;
        const target = field.current?.status === 'destroyed' ? editor : (field.current ?? editor);
        field.current = null;
        insertVariable(target, declaration.name);
        target.focus();
      }}
      onOpenChangeComplete={(open) => {
        if (!open) field.current = null;
      }}
      itemToStringLabel={variableLabel}
      // The same match as the `{{` menu: a label or a name.
      filter={(declaration: VariableDeclaration, query: string) => matchesVariable(declaration, query)}
    >
      <EditorToolbarComboboxTrigger
        data-slot="variable-menu"
        icon={BracesIcon}
        label={messages.variable}
        className={className}
        onPointerDownCapture={() => reach(document.activeElement)}
        onFocusCapture={(event) => reach(event.relatedTarget as Element | null)}
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
