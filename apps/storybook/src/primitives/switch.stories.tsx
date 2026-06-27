import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from '@zeroxsolutions/ui/switch';

/**
 * `Switch` is a Base UI toggle control for turning a single setting on or off,
 * rendering a track with a sliding thumb. It supports controlled and uncontrolled
 * use and exposes a `size` prop (`sm` | `default`) to adjust its footprint.
 */
const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
};
export default meta;

type Story = StoryObj<typeof Switch>;

/** Default-size switch in the checked (on) state via `defaultChecked`. */
export const Default: Story = {
  render: () => <Switch defaultChecked />,
};

/** The compact `sm` size variant, shown checked. */
export const Small: Story = {
  render: () => <Switch size="sm" defaultChecked />,
};
