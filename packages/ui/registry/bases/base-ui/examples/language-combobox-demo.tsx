import { useState, type ReactNode } from 'react';

import { LanguageCombobox } from '@/registry/bases/base-ui/components/data-entry/language-combobox';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/registry/bases/base-ui/ui/combobox';

/** The built-in code-language options, picked from a trigger showing the current one. */
function LanguageComboboxDemo(): ReactNode {
  const [value, setValue] = useState('typescript');

  return (
    <LanguageCombobox kind="code" value={value} onValueChange={setValue}>
      <ComboboxTrigger render={<Button variant="outline" size="sm" />} aria-label="Select language">
        <ComboboxValue>
          {(option) => (
            <>
              {option?.icon}
              <span>{option?.label ?? 'Select'}</span>
            </>
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon}
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </LanguageCombobox>
  );
}

export { LanguageComboboxDemo };
