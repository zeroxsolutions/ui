import type { ReactNode } from 'react';

import { AiProviderPicker, DEFAULT_AI_PROVIDER_ENTRIES } from '@/registry/bases/base-ui/blocks/ai-provider-picker';

/** The AiProviderPicker block over its sample providers. */
function AiProviderPickerDemo(): ReactNode {
  return (
    <div className="w-full">
      <AiProviderPicker entries={DEFAULT_AI_PROVIDER_ENTRIES} />
    </div>
  );
}

export { AiProviderPickerDemo };
