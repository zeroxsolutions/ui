import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@zeroxsolutions/ui/components/ui/input';

/**
 * `Input` is a styled single-line text field built on the Base UI input
 * primitive. It forwards all native `<input>` props (`type`, `placeholder`,
 * `disabled`, `defaultValue`, and so on) and stretches to fill its container, so
 * use it for any free-form text or value entry within a form.
 */
const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

/** Baseline empty field with a placeholder, constrained to a fixed width. */
export const Default: Story = {
  render: () => <Input placeholder="Email" className="w-64" />,
};

/** Disabled state: a pre-filled, non-interactive field shown at reduced opacity. */
export const Disabled: Story = {
  render: () => (
    <Input
      placeholder="Disabled"
      defaultValue="hello@example.com"
      disabled
      className="w-64"
    />
  ),
};
