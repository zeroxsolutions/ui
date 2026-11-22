'use client';

import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/registry/bases/base-ui/ui/combobox';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { insertVariable, matchesVariable, variableIcon, variableLabel } from './variable';

export interface VariableMenuProps {
  editor: IEditor;
  declarations: readonly VariableDeclaration[];
  /** Its words; the English when absent. */
  messages?: ProfileEditorMessages;
  className?: string;
}

/** The toolbar's "Variable" picker: a filterable list of the declarations, each inserted at the caret. */
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
      <ComboboxTrigger data-slot="variable-menu" render={<Button variant="ghost" size="sm" className={className} />}>
        {messages.variable}
      </ComboboxTrigger>
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
