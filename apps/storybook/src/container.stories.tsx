import type { Meta, StoryObj } from '@storybook/react-vite';

import { Container } from '@chiselart/ui/container';

const meta: Meta<typeof Container> = {
  title: 'Layouts/Container',
  component: Container,
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg', 'full'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Container>;

/** Drive `size` from the controls panel to see the width snap across the scale. */
export const Playground: Story = {
  args: { size: 'md' },
  render: (args) => (
    <Container {...args} className="px-6 py-4">
      <div className="rounded-md bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
        size=&quot;{args.size ?? 'md'}&quot; — centred, full-width up to the cap
      </div>
    </Container>
  ),
};

/** The width scale at a glance, widest to none. */
export const Sizes: Story = {
  render: () => (
    <div className="w-full space-y-3">
      {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
        <Container key={size} size={size} className="px-6">
          <div className="rounded-md bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
            size=&quot;{size}&quot;
          </div>
        </Container>
      ))}
    </div>
  ),
};
