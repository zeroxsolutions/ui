import {
  AiProviderPicker,
  DEFAULT_AI_PROVIDER_ENTRIES,
} from "@/registry/bases/base-ui/blocks/ai-provider-picker"

/** The AiProviderPicker block - the hero for the `ai-provider-picker` block. */
export function AiProviderPickerHero() {
  return (
    <div className="w-full">
      <AiProviderPicker entries={DEFAULT_AI_PROVIDER_ENTRIES} />
    </div>
  )
}
