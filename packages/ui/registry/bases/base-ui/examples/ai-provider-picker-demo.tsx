import type { ReactNode } from 'react';

import {
  AI_PROVIDER_PICKER_SAMPLE_ENTRIES,
  AiProviderPicker,
} from '@/registry/bases/base-ui/blocks/ai-provider-picker';

/** The AiProviderPicker block over its sample providers. */
function AiProviderPickerDemo(): ReactNode {
  return (
    <div className="w-full">
      <AiProviderPicker entries={AI_PROVIDER_PICKER_SAMPLE_ENTRIES} />
    </div>
  );
}

export { AiProviderPickerDemo };
