import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  LayoutGrid,
  MessageSquareText,
  PackageOpen,
  RefreshCw,
} from 'lucide-react';

import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';
import { ModelList } from '@zeroxsolutions/ui/components/model-list';
import { ModelListItem } from '@zeroxsolutions/ui/components/model-list-item';
import { ModelListSkeleton } from '@zeroxsolutions/ui/components/model-list-skeleton';
import { SearchInput } from '@zeroxsolutions/ui/components/search-input';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@zeroxsolutions/ui/components/ui/empty';
import { ItemGroup } from '@zeroxsolutions/ui/components/ui/item';
import { Tabs, TabsList, TabsTrigger } from '@zeroxsolutions/ui/components/ui/tabs';

/**
 * `ModelList` is the presentational frame for a model list section: a header
 * with a `title` and a trailing `controls` slot (search, refresh), an optional
 * `tabs` slot, and a scrollable region for its children. It owns no list state -
 * the consumer supplies prepared children (item groups, an empty state, or a
 * loading skeleton) and the controls.
 */
const meta: Meta<typeof ModelList> = {
  title: 'Components/ModelList',
  component: ModelList,
};
export default meta;

type Story = StoryObj<typeof ModelList>;

const controls = (
  <>
    <SearchInput placeholder="Search models" className="h-8 w-44" />
    <Button variant="ghost" size="icon" aria-label="Refresh models">
      <RefreshCw className="size-3.5" />
    </Button>
  </>
);

const tabs = (
  <Tabs defaultValue="all">
    <TabsList variant="line" className="h-auto">
      <TabsTrigger value="all" className="gap-1.5 px-2 text-xs">
        <LayoutGrid className="size-3.5" />
        All
      </TabsTrigger>
      <TabsTrigger value="chat" className="gap-1.5 px-2 text-xs">
        <MessageSquareText className="size-3.5" />
        Chat
      </TabsTrigger>
    </TabsList>
  </Tabs>
);

/** The assembled frame: title + search/refresh controls + tabs + a group of
 *  items. Enable state is wired by the consumer; here they are no-ops. */
export const Default: Story = {
  render: () => (
    <div className="flex h-[520px] w-[640px] flex-col rounded-lg border p-4">
      <ModelList title="Model list" controls={controls} tabs={tabs}>
        <ItemGroup>
          <ModelListItem
            name="GPT-4o"
            modelId="gpt-4o"
            media={<AiProviderIcon provider="openai" size={32} />}
            enabled
            onEnabledChange={() => {}}
            onRemove={() => {}}
          />
          <ModelListItem
            name="Claude Opus 4.8"
            modelId="claude-opus-4-8"
            media={<AiProviderIcon provider="anthropic" size={32} />}
            enabled
            onEnabledChange={() => {}}
            onRemove={() => {}}
          />
          <ModelListItem
            name="Gemini 2.5 Pro"
            modelId="gemini-2.5-pro"
            media={<AiProviderIcon provider="gemini" size={32} />}
            enabled={false}
            onEnabledChange={() => {}}
            onRemove={() => {}}
          />
        </ItemGroup>
      </ModelList>
    </div>
  ),
};

/** First-fetch loading state - the skeleton mirrors the item shape. */
export const Loading: Story = {
  render: () => (
    <div className="flex h-[520px] w-[640px] flex-col rounded-lg border p-4">
      <ModelList title="Model list">
        <ModelListSkeleton />
      </ModelList>
    </div>
  ),
};

/** Empty state - reuses the shipped `Empty`. */
export const NoModels: Story = {
  render: () => (
    <div className="flex h-[520px] w-[640px] flex-col rounded-lg border p-4">
      <ModelList title="Model list">
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen />
            </EmptyMedia>
            <EmptyTitle>No models available</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </ModelList>
    </div>
  ),
};
