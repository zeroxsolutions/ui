'use client';

import { useEffect, useState } from 'react';
import { LinkIcon } from '@/registry/bases/base-ui/icons/lucide/link-icon';
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
import { matchesVariable, variableIcon, variableLabel } from '../variables/variable';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { EditorToolbarComboboxTrigger } from '../../document/ui/editor-toolbar-combobox-trigger';
import { emailLinkAt } from './kit-context';

/** The declarations, or a getter a picker reads each time it opens, since a host may change them while it is shown. */
export type DeclarationSource = readonly VariableDeclaration[] | (() => readonly VariableDeclaration[]);

function urlDeclarations(source: DeclarationSource): VariableDeclaration[] {
  const all = typeof source === 'function' ? source() : source;
  return all.filter((declaration) => declaration.type === 'url');
}

export interface UrlVariablePickerProps {
  declarations: DeclarationSource;
  /** The name of the variable chosen now, if any. */
  value: string | null;
  onValueChange(name: string): void;
  /** What the picker chooses; assistive technology reads it before the chosen variable. */
  label: string;
  disabled?: boolean;
  /** The words of its search field and its empty list; the English when absent. */
  messages?: ProfileEditorMessages;
  className?: string;
}

/**
 * The one picker for an email link target: the declared `url` variables only, because the house renderer
 * accepts an href or a link that is exactly one `url` token. Its trigger is a toolbar icon named by `label`,
 * and by the chosen variable after it when there is one.
 */
export function UrlVariablePicker({
  declarations,
  value,
  onValueChange,
  label,
  disabled,
  messages = DEFAULT_PROFILE_MESSAGES,
  className,
}: UrlVariablePickerProps) {
  const [items, setItems] = useState(() => urlDeclarations(declarations));
  const chosen = items.find((declaration) => declaration.name === value) ?? null;
  return (
    <Combobox
      items={items}
      // The trigger shows `value`; the list keeps none, so picking the variable already chosen fires again, as a
      // link widened over more text needs.
      value={null}
      disabled={disabled}
      onOpenChange={(open) => {
        if (open) setItems(urlDeclarations(declarations));
      }}
      onValueChange={(declaration: VariableDeclaration | null) => {
        if (declaration) onValueChange(declaration.name);
      }}
      itemToStringLabel={variableLabel}
      filter={(declaration: VariableDeclaration, query: string) => matchesVariable(declaration, query)}
    >
      <EditorToolbarComboboxTrigger
        data-slot="url-variable-picker"
        data-label={label}
        icon={LinkIcon}
        label={chosen || value ? `${label}: ${chosen ? variableLabel(chosen) : value}` : label}
        className={className}
      />
      <ComboboxContent className="w-64">
        <ComboboxInput showTrigger={false} placeholder={messages.findLink} aria-label={messages.findLink} />
        <ComboboxEmpty>{messages.noLinkVariables}</ComboboxEmpty>
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

export interface LinkVariablePickerProps {
  editor: IEditor;
  declarations: DeclarationSource;
  /** Its words; the English when absent. */
  messages?: ProfileEditorMessages;
  /** Refuses to open, as while the editor is out of sight. */
  disabled?: boolean;
  className?: string;
}

/** The toolbar's link control: shows the link on the selection and links the selected text to the chosen `url` variable. */
export function LinkVariablePicker({
  editor,
  declarations,
  messages = DEFAULT_PROFILE_MESSAGES,
  disabled,
  className,
}: LinkVariablePickerProps) {
  const [linked, setLinked] = useState(() => emailLinkAt(editor));
  useEffect(() => {
    const update = () => setLinked(emailLinkAt(editor));
    update();
    const offSelection = editor.onSelectionUpdate(update);
    const offChange = editor.onChange(update);
    return () => {
      offSelection();
      offChange();
    };
  }, [editor]);
  return (
    <UrlVariablePicker
      declarations={declarations}
      value={linked}
      label={messages.link}
      messages={messages}
      disabled={disabled}
      className={className}
      onValueChange={(variable) => {
        editor.run('setEmailLink', { variable });
      }}
    />
  );
}
