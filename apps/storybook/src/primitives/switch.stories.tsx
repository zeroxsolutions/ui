import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from '@chiselart/ui/switch';

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => <Switch defaultChecked />,
};

export const Small: Story = {
  render: () => <Switch size="sm" defaultChecked />,
};
