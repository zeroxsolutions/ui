import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageContainer } from '@chiselart/ui/page-container';

const meta: Meta<typeof PageContainer> = {
  title: 'Layouts/PageContainer',
  component: PageContainer,
};
export default meta;

type Story = StoryObj<typeof PageContainer>;

export const Default: Story = {
  render: () => (
    <div className="w-full bg-muted/40 py-4">
      <PageContainer className="rounded-md bg-card p-6 ring-1 ring-foreground/10">
        <h2 className="text-lg font-medium">Centered content column</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Capped at max-w-5xl and centered, so it doesn&apos;t stretch
          edge-to-edge on wide screens.
        </p>
      </PageContainer>
    </div>
  ),
};
