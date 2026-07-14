import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { AnthropicMark } from '@zeroxsolutions/icons/brands/anthropic';
import { MistralMark } from '@zeroxsolutions/icons/brands/mistral';
import { OllamaMark } from '@zeroxsolutions/icons/brands/ollama';
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';
import { AiProviderCard } from '@zeroxsolutions/ui/components/ai-provider-card';
import { Switch } from '@zeroxsolutions/ui/components/ui/switch';

/**
 * `AiProviderCard` is a domain-free tile for one AI provider in an overview
 * grid: a brand-mark `icon` slot with the name, a two-line description with
 * reserved height so grid rows align, and a footer with a muted meta note (or a
 * tone-styled status) plus a trailing `action` control. The whole card selects
 * on click; the `action` sits in a stop-propagation island. The consumer
 * supplies the mark and the control - here, `@zeroxsolutions/icons` marks and a
 * `Switch`.
 */
const meta: Meta<typeof AiProviderCard> = {
  title: 'Components/AiProviderCard',
  component: AiProviderCard,
};
export default meta;

type Story = StoryObj<typeof AiProviderCard>;

/** A trailing enable control that owns its own state - the `action` slot. */
function EnableSwitch({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return <Switch checked={checked} onCheckedChange={setChecked} />;
}

/** One provider tile: mark + name, blurb, model-count meta, and an enable switch. */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <AiProviderCard
        name="OpenAI"
        icon={<OpenaiMark.Avatar size={20} shape="square" />}
        description="GPT-5, o-series reasoning, and the image and audio models behind the Responses API."
        meta="12 models"
        action={<EnableSwitch />}
        onSelect={() => console.log('select OpenAI')}
      />
    </div>
  ),
};

/**
 * A grid of providers with descriptions of differing length - the reserved
 * description height keeps every footer (and switch) on the same baseline.
 */
export const Grid: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AiProviderCard
        name="OpenAI"
        icon={<OpenaiMark.Avatar size={20} shape="square" />}
        description="GPT-5 and the o-series reasoning models."
        meta="12 models"
        action={<EnableSwitch />}
        onSelect={() => {}}
      />
      <AiProviderCard
        name="Anthropic"
        icon={<AnthropicMark.Avatar size={20} shape="square" />}
        description="The Claude family: Opus, Sonnet, and Haiku, with long-context and tool use across every tier of the lineup."
        meta="8 models"
        action={<EnableSwitch />}
        onSelect={() => {}}
      />
      <AiProviderCard
        name="Mistral"
        icon={<MistralMark.Avatar size={20} shape="square" />}
        description="Open-weight and hosted models."
        meta="6 models"
        action={<EnableSwitch defaultChecked={false} />}
        onSelect={() => {}}
      />
    </div>
  ),
};

/** Footer status replaces the meta note and is styled by tone. */
export const WithStatus: Story = {
  render: () => (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      <AiProviderCard
        name="Ollama"
        icon={<OllamaMark.Avatar size={20} shape="square" />}
        description="Local models served over the Ollama runtime."
        status={{ tone: 'busy', text: 'Runtime not reachable' }}
        action={<EnableSwitch defaultChecked={false} />}
        onSelect={() => {}}
      />
      <AiProviderCard
        name="Mistral"
        icon={<MistralMark.Avatar size={20} shape="square" />}
        description="Hosted models via API key."
        status={{ tone: 'idle', text: 'Key added, not verified' }}
        action={<EnableSwitch />}
        onSelect={() => {}}
      />
    </div>
  ),
};

/**
 * A provider with no user-controlled enable: the consumer passes a disabled
 * `Switch` so the row still reads as a uniform status, and omits `onSelect`.
 */
export const NoToggle: Story = {
  render: () => (
    <div className="w-80">
      <AiProviderCard
        name="Chisel gateway"
        description="The built-in gateway. Always on; no per-provider enable."
        meta="Not connected"
        action={<Switch checked disabled />}
      />
    </div>
  ),
};
