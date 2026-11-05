import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';

const FRAMEWORKS = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'];

function ComboboxDemo(): ReactNode {
  return (
    <View className="gap-6">
      <Combobox items={FRAMEWORKS}>
        <View className="flex-row items-center gap-1">
          <ComboboxTrigger aria-label="Framework" className="w-64">
            <ComboboxValue placeholder="Select a framework" />
          </ComboboxTrigger>
          <ComboboxClear />
        </View>
        <ComboboxContent className="w-64">
          <ComboboxInput placeholder="Search framework..." />
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Combobox multiple items={FRAMEWORKS} defaultValue={['Next.js']}>
        <ComboboxChips className="w-72">
          <ComboboxValue>
            {(values) => values.map((value) => <ComboboxChip key={value}>{value}</ComboboxChip>)}
          </ComboboxValue>
          <ComboboxChipsInput aria-label="Frameworks" placeholder="Add framework" />
        </ComboboxChips>
        <ComboboxContent className="w-72">
          <ComboboxInput placeholder="Search framework..." />
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </View>
  );
}

export { ComboboxDemo };
