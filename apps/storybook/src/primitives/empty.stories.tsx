import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@zeroxsolutions/ui/empty';
import { InboxIcon, PlusIcon } from 'lucide-react';

/**
 * `Empty` is a centered placeholder container for empty or zero-data states,
 * such as an inbox with no messages or a list with no records. Compose it from
 * `EmptyHeader`, `EmptyMedia` (e.g. an icon badge), `EmptyTitle`, and
 * `EmptyDescription`, with an optional `EmptyContent` slot for a call-to-action.
 */
const meta: Meta<typeof Empty> = {
  title: 'Primitives/Empty',
  component: Empty,
};
export default meta;

type Story = StoryObj<typeof Empty>;

/**
 * Informational empty state with an icon badge, title, and description and no
 * call to action.
 */
export const Default: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No messages yet</EmptyTitle>
        <EmptyDescription>
          When you receive messages, they will show up here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

/**
 * Actionable empty state that adds an `EmptyContent` slot with a primary button
 * to guide the user toward creating their first record.
 */
export const WithAction: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No projects</EmptyTitle>
        <EmptyDescription>
          Create your first project to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <PlusIcon />
          New project
        </Button>
      </EmptyContent>
    </Empty>
  ),
};
