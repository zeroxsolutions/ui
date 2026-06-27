import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@zeroxsolutions/ui/hover-card';

const meta: Meta<typeof HoverCard> = {
  title: 'Primitives/HoverCard',
  component: HoverCard,
};
export default meta;

type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger className="text-sm font-medium underline underline-offset-4">
        @app
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">App</p>
          <p className="text-sm text-muted-foreground">
            A design and editing toolkit for building cross-platform interfaces.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Joined June 2026</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
