import { useState, type ReactNode } from 'react';

import { LanguageToggleGroup } from '@/components/data-entry/language-toggle-group';
import { Text } from '@/components/ui/text';
import { ToggleGroupItem } from '@/components/ui/toggle-group';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'vi', label: 'Vietnamese' },
] as const;

/** A fixed three-language switch, always one language pressed. */
function LanguageToggleGroupDemo(): ReactNode {
  const [value, setValue] = useState('en');

  return (
    <LanguageToggleGroup value={value} onValueChange={setValue} aria-label="Language">
      {LANGUAGES.map((language) => (
        <ToggleGroupItem key={language.value} value={language.value}>
          <Text>{language.label}</Text>
        </ToggleGroupItem>
      ))}
    </LanguageToggleGroup>
  );
}

export { LanguageToggleGroupDemo };
