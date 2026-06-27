import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';

import { Badge } from '@zeroxsolutions/ui/badge';
import { Center } from '@zeroxsolutions/ui/center';

const meta: Meta<typeof Center> = {
  title: 'Layouts/Center',
  component: Center,
  argTypes: {
    inline: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Center>;

export const Default: Story = {
  render: () => (
    <Center className="size-48 rounded-md bg-muted/50">
      <Badge>Centered</Badge>
    </Center>
  ),
};

export const Inline: Story = {
  render: () => (
    <p className="text-sm">
      A badge{' '}
      <Center inline className="align-middle">
        <Badge variant="secondary">
          <Star className="size-3" />
        </Badge>
      </Center>{' '}
      sits inline with text.
    </p>
  ),
};

export const AsMain: Story = {
  name: 'Polymorphic (render)',
  render: () => (
    <Center render={<main />} className="h-32 w-full rounded-md bg-muted/50">
      <Badge variant="secondary">Rendered as &lt;main&gt;</Badge>
    </Center>
  ),
};
