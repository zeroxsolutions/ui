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
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { EditorToolbarComboboxTrigger } from '../../document/ui/editor-toolbar-combobox-trigger';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { insertVariable, matchesVariable, variableIcon, variableLabel } from './variable';

export interface VariableMenuProps {
  editor: IEditor;
  declarations: readonly VariableDeclaration[];
  /** Its words; the English when absent. */
  messages?: ProfileEditorMessages;
  /** Refuses to open, as while the editor is out of sight. */
  disabled?: boolean;
  className?: string;
}

/** The toolbar's variable picker: a filterable list of the declarations, each inserted at the caret. */
export function VariableMenu({
  editor,
  declarations,
  messages = DEFAULT_PROFILE_MESSAGES,
  disabled,
  className,
}: VariableMenuProps) {
  return (
    <Combobox
      items={declarations as VariableDeclaration[]}
      // A picker, not a field: it keeps no value, so the same variable can be inserted again.
      value={null}
      disabled={disabled}
      onValueChange={(declaration: VariableDeclaration | null) => {
        if (!declaration) return;
        insertVariable(editor, declaration.name);
        editor.focus();
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
