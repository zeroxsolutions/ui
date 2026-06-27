import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@zeroxsolutions/ui/progress';

/**
 * `Progress` is a Base UI indicator that visualizes completion of a determinate
 * task as a filled track. The root renders the track and indicator
 * automatically; pass `value` (0–100) to set the fill amount, and optionally
 * compose `ProgressLabel` and `ProgressValue` for a textual readout.
 */
const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
};
export default meta;

type Story = StoryObj<typeof Progress>;

/** Bare progress bar fixed at 60%, with no accompanying text. */
export const Default: Story = {
  render: () => <Progress value={60} className="w-64" />,
};

/** Progress bar paired with a `ProgressLabel` and an auto-formatted `ProgressValue` readout. */
export const WithLabel: Story = {
  render: () => (
    <Progress value={42} className="w-64">
      <ProgressLabel>Uploading</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
