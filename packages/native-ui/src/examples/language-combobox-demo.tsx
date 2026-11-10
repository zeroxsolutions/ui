import { useState, type ReactNode } from 'react';

import { LanguageCombobox } from '@/components/data-entry/language-combobox';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';

/** The built-in code-language options, picked from a trigger showing the current one. */
function LanguageComboboxDemo(): ReactNode {
  const [value, setValue] = useState('typescript');

  return (
    <LanguageCombobox kind="code" value={value} onValueChange={setValue}>
      <ComboboxTrigger size="sm" aria-label="Select language">
        <ComboboxValue placeholder="Select" />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option.value}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </LanguageCombobox>
  );
}

export { LanguageComboboxDemo };
