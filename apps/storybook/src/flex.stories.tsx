import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '@chiselart/ui/badge';
import { Flex } from '@chiselart/ui/flex';

const meta: Meta<typeof Flex> = {
  title: 'Layouts/Flex',
  component: Flex,
  argTypes: {
    direction: {
      control: 'select',
      options: ['row', 'column', 'row-reverse', 'column-reverse'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'baseline', 'stretch'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    wrap: { control: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] },
    inline: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Flex>;

export const Row: Story = {
  render: () => (
    <Flex gap={2}>
      <Badge>One</Badge>
      <Badge>Two</Badge>
      <Badge>Three</Badge>
    </Flex>
  ),
};

export const Column: Story = {
  render: () => (
    <Flex direction="column" gap={2} align="start">
      <Badge>One</Badge>
      <Badge>Two</Badge>
      <Badge>Three</Badge>
    </Flex>
  ),
};

export const SpaceBetween: Story = {
  render: () => (
    <Flex justify="between" align="center" className="w-80 rounded-md bg-muted/50 p-2">
      <Badge>Start</Badge>
      <Badge>End</Badge>
    </Flex>
  ),
};

export const Wrap: Story = {
  render: () => (
    <Flex wrap="wrap" gap={2} className="w-64">
      {Array.from({ length: 8 }, (_, i) => (
        <Badge key={i}>{i + 1}</Badge>
      ))}
    </Flex>
  ),
};

export const Playground: Story = {
  args: { direction: 'row', align: 'center', justify: 'start', gap: 4 },
  render: (args) => (
    <Flex {...args} className="min-h-24 w-80 rounded-md bg-muted/50 p-2">
      <Badge>One</Badge>
      <Badge>Two</Badge>
      <Badge>Three</Badge>
    </Flex>
  ),
};
