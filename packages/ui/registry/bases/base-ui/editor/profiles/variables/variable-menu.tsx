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
import { insertVariable, variableIcon, variableLabel } from './variable';

export interface VariableMenuProps {
  editor: IEditor;
  declarations: readonly VariableDeclaration[];
  className?: string;
}

/** The toolbar's "Variable" picker: a filterable list of the declarations, each inserted at the caret. */
export function VariableMenu({ editor, declarations, className }: VariableMenuProps) {
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
    >
      <ComboboxTrigger data-slot="variable-menu" render={<Button variant="ghost" size="sm" className={className} />}>
        Variable
      </ComboboxTrigger>
      <ComboboxContent className="w-64">
        <ComboboxInput showTrigger={false} placeholder="Find a variable" aria-label="Find a variable" />
        <ComboboxEmpty>No variables found</ComboboxEmpty>
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
