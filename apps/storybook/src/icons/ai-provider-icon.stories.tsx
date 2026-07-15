import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';

/**
 * `AiProviderIcon` resolves an AI provider key to a vendored
 * `@zeroxsolutions/icons` brand mark and renders the requested variant
 * (`color` / `mono` / `avatar` / `combine`) at a numeric size, falling back to a
 * neutral placeholder for an unknown key. It is the node meant for
 * `AiProviderCard`'s `icon` slot.
 */
const meta: Meta<typeof AiProviderIcon> = {
  title: 'Icons/AiProviderIcon',
  component: AiProviderIcon,
  args: { provider: 'openai', type: 'color', size: 40 },
  argTypes: {
    type: { control: 'inline-radio', options: ['color', 'mono', 'avatar', 'combine'] },
    size: { control: { type: 'range', min: 12, max: 96, step: 4 } },
  },
};
export default meta;

type Story = StoryObj<typeof AiProviderIcon>;

const PROVIDERS = [
  'anthropic', 'openai', 'gemini', 'google', 'deepseek', 'groq', 'mistral',
  'grok', 'qwen', 'kimi', 'moonshot', 'zhipu', 'zai', 'minimax', 'doubao',
  'bailian', 'xiaomi', 'modelscope', 'stepfun', 'volcengine', 'newapi',
  'ollama', 'openrouter', 'azure', 'nvidia', 'meta', 'gemma', 'codex', 'bfl',
  'flux', 'stability', 'bytedance', 'cloudflare', 'workersai', 'baai', 'ibm',
  'llava', 'myshell', 'recraft', 'pixverse', 'vidu', 'runway', 'assemblyai',
  'microsoft', 'huggingface', 'pipecat', 'inworld', 'deepgram', 'leonardo',
  'ai4bharat', 'unknown-provider',
];

/** Single icon - use the controls to switch provider / type / size. */
export const Playground: Story = {};

/** Every mapped AI provider (plus an unknown-key fallback at the end). */
export const AllProviders: Story = {
  render: (args) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4">
      {PROVIDERS.map((provider) => (
        <div
          key={provider}
          className="flex flex-col items-center gap-2 rounded-md border p-3 text-center"
        >
          <AiProviderIcon {...args} provider={provider} />
          <span className="text-muted-foreground truncate text-xs">
            {provider}
          </span>
        </div>
      ))}
    </div>
  ),
};

/** The four variants for one provider. */
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      {(['color', 'mono', 'avatar', 'combine'] as const).map((type) => (
        <div key={type} className="flex flex-col items-center gap-2">
          <AiProviderIcon provider="gemini" type={type} size={40} />
          <span className="text-muted-foreground text-xs">{type}</span>
        </div>
      ))}
    </div>
  ),
};

/** A range of sizes. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {[16, 24, 32, 48, 64].map((size) => (
        <AiProviderIcon key={size} provider="anthropic" type="color" size={size} />
      ))}
    </div>
  ),
};
