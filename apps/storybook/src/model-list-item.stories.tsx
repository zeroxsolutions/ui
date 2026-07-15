import type { Meta, StoryObj } from '@storybook/react-vite';
import { Atom, Eye, Wrench } from 'lucide-react';
import { useState } from 'react';

import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';
import { IconChip } from '@zeroxsolutions/ui/components/icon-chip';
import { ModelListItem } from '@zeroxsolutions/ui/components/model-list-item';
import { Badge } from '@zeroxsolutions/ui/components/ui/badge';
import { ItemGroup } from '@zeroxsolutions/ui/components/ui/item';

/**
 * `ModelListItem` is one model in a model list, built on the shipped `Item`: a
 * leading logo slot (here an `AiProviderIcon`), the model name over its id, a
 * meta slot for capability / token chips, and trailing controls (an enable
 * `Switch` and a remove button). Domain-free: the consumer supplies the logo,
 * chips, and state. An `unavailable` model stays listed but dimmed with its
 * toggle disabled.
 */
const meta: Meta<typeof ModelListItem> = {
  title: 'Components/ModelListItem',
  component: ModelListItem,
};
export default meta;

type Story = StoryObj<typeof ModelListItem>;

/** Capability chips - the consumer feeds each `IconChip` an icon/label/tint. */
function Capabilities() {
  return (
    <>
      <IconChip
        icon={<Eye className="size-3" />}
        label="Vision input"
        tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      />
      <IconChip
        icon={<Atom className="size-3" />}
        label="Reasoning"
        tint="bg-violet-500/15 text-violet-600 dark:text-violet-400"
      />
      <IconChip
        icon={<Wrench className="size-3" />}
        label="Function calling"
        tint="bg-blue-500/15 text-blue-600 dark:text-blue-400"
      />
    </>
  );
}

/** Token pills reuse the shipped `Badge` - no new look-alike. */
function TokenPills() {
  return (
    <>
      <Badge variant="secondary" className="font-mono">
        128K
      </Badge>
      <Badge variant="secondary" className="font-mono">
        16K
      </Badge>
    </>
  );
}

/** A single interactive item: logo, name/id, capability + token meta, toggle. */
export const Playground: Story = {
  args: { name: 'GPT-4o', modelId: 'gpt-4o', unavailable: false },
  render: (args) => {
    const [on, setOn] = useState(true);
    return (
      <div className="w-[560px]">
        <ModelListItem
          {...args}
          media={<AiProviderIcon provider="openai" size={32} />}
          meta={
            <>
              <Capabilities />
              <TokenPills />
            </>
          }
          enabled={on}
          onEnabledChange={setOn}
          onRemove={() => {}}
        />
      </div>
    );
  },
};

/** Enabled, disabled, unavailable (dimmed + toggle off), and read-only (a
 *  toggle with no handler, e.g. a derived state). */
export const States: Story = {
  render: () => {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <div className="w-[560px]">
        <ItemGroup>
          <ModelListItem
            name="Claude Opus 4.8"
            modelId="claude-opus-4-8"
            media={<AiProviderIcon provider="anthropic" size={32} />}
            meta={<Capabilities />}
            enabled={a}
            onEnabledChange={setA}
            onRemove={() => {}}
          />
          <ModelListItem
            name="Gemini 2.5 Pro"
            modelId="gemini-2.5-pro"
            media={<AiProviderIcon provider="gemini" size={32} />}
            meta={<TokenPills />}
            enabled={b}
            onEnabledChange={setB}
            onRemove={() => {}}
          />
          <ModelListItem
            name="Grok 2"
            modelId="grok-2"
            media={<AiProviderIcon provider="grok" size={32} />}
            meta={<TokenPills />}
            enabled
            unavailable
            onEnabledChange={() => {}}
          />
          <ModelListItem
            name="Local runtime model"
            modelId="cli-agent"
            media={<AiProviderIcon provider="ollama" size={32} />}
            enabled
          />
        </ItemGroup>
      </div>
    );
  },
};
