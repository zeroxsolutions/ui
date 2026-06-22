import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd, KbdGroup } from '@chiselart/ui/kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Primitives/Kbd',
  component: Kbd,
};
export default meta;

type Story = StoryObj<typeof Kbd>;

export const Default: Story = {
  render: () => <Kbd>⌘</Kbd>,
};

export const Combo: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};
