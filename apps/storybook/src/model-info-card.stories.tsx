import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowDown, ArrowUp, Atom, Eye, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';

import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';
import { IconChip } from '@zeroxsolutions/ui/components/icon-chip';
import {
  ModelInfoCard,
  ModelInfoCardSection,
} from '@zeroxsolutions/ui/components/model-info-card';
import { ModelListItem } from '@zeroxsolutions/ui/components/model-list-item';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@zeroxsolutions/ui/components/ui/hover-card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from '@zeroxsolutions/ui/components/ui/item';

/**
 * `ModelInfoCard` is a domain-free model detail panel for the shipped
 * `HoverCard`: an identity header (logo slot + name + vendor + modelId) over
 * `ModelInfoCardSection`s (an accent bar + title + optional value). Detail lines
 * reuse the shipped `Item` + `IconChip` - no line/row component. The consumer
 * maps its own data and wraps a `ModelListItem` in `HoverCardTrigger`.
 */
const meta: Meta<typeof ModelInfoCard> = {
  title: 'Components/ModelInfoCard',
  component: ModelInfoCard,
};
export default meta;

type Story = StoryObj<typeof ModelInfoCard>;

/** One ability line: an `IconChip` in the media slot + the label. */
function AbilityLine({
  icon,
  label,
  tint,
}: {
  icon: ReactNode;
  label: string;
  tint: string;
}) {
  return (
    <Item size="xs" className="px-0 py-1">
      <ItemMedia>
        <IconChip icon={icon} label={label} tint={tint} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

/** One pricing line: an `IconChip` + label on the left, the rate on the right. */
function PriceLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const tint = 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return (
    <Item size="xs" className="px-0 py-1">
      <ItemMedia>
        <IconChip icon={icon} label={label} tint={tint} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <span className="text-[11px] whitespace-nowrap text-muted-foreground">
          {value}
        </span>
      </ItemActions>
    </Item>
  );
}

/** The full panel body - the consumer composes it from mapped data. */
function GptDetail() {
  return (
    <ModelInfoCard
      media={<AiProviderIcon provider="openai" size={36} />}
      name="GPT-4o"
      vendor="OpenAI"
      modelId="gpt-4o"
    >
      <ModelInfoCardSection
        accent="bg-blue-500"
        title="Context Length"
        value="128K tokens"
      />
      <ModelInfoCardSection accent="bg-violet-500" title="Abilities">
        <AbilityLine
          icon={<Eye className="size-3" />}
          label="Vision input"
          tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <AbilityLine
          icon={<Atom className="size-3" />}
          label="Reasoning"
          tint="bg-violet-500/15 text-violet-600 dark:text-violet-400"
        />
        <AbilityLine
          icon={<Wrench className="size-3" />}
          label="Function calling"
          tint="bg-blue-500/15 text-blue-600 dark:text-blue-400"
        />
      </ModelInfoCardSection>
      <ModelInfoCardSection accent="bg-amber-500" title="Pricing">
        <PriceLine
          icon={<ArrowUp className="size-3" />}
          label="Input"
          value="3 credits/M tokens"
        />
        <PriceLine
          icon={<ArrowDown className="size-3" />}
          label="Output"
          value="10 credits/M tokens"
        />
      </ModelInfoCardSection>
    </ModelInfoCard>
  );
}

/** The panel standalone, framed like the popover surface it renders inside. */
export const Panel: Story = {
  render: () => (
    <div className="w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <GptDetail />
    </div>
  ),
};

/** The intended wiring: a `ModelListItem` in a `HoverCardTrigger`, the panel as
 *  content. Hover the item to reveal it. */
export const OnHover: Story = {
  render: () => (
    <div className="w-[560px] p-6">
      <HoverCard>
        <HoverCardTrigger
          render={
            <ModelListItem
              name="GPT-4o"
              modelId="gpt-4o"
              media={<AiProviderIcon provider="openai" size={32} />}
              enabled
              onEnabledChange={() => {}}
            />
          }
        />
        <HoverCardContent side="right" align="start" className="w-80">
          <GptDetail />
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};
