import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker } from '@/components/data-entry/ai-provider-picker';

/** The AiProviderPicker over its sample providers. */
function AiProviderPickerDemo(): ReactNode {
  return (
    <View className="w-full">
      <AiProviderPicker entries={AI_PROVIDER_PICKER_SAMPLE_ENTRIES} />
    </View>
  );
}

export { AiProviderPickerDemo };
