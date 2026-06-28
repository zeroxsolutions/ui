import type { Meta, StoryObj } from '@storybook/react-vite';

import { PasswordInput } from '@zeroxsolutions/ui/components/password-input';

/**
 * `PasswordInput` is a text field that masks its value and exposes a show/hide
 * toggle in the inline-end addon, so call-sites never re-wire the eye button. It
 * renders `type="password"` by default and switches to `type="text"` when the
 * toggle is pressed; `className` sizes the group and remaining props (including
 * `defaultValue`, `onChange`, and `ref`) flow straight to the underlying input.
 */
const meta: Meta<typeof PasswordInput> = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
};
export default meta;

type Story = StoryObj<typeof PasswordInput>;

/** Empty field in its default masked state, sized with a fixed width. */
export const Default: Story = {
  render: () => <PasswordInput placeholder="Password" className="w-64" />,
};

/** Pre-filled via `defaultValue`, demonstrating the masked value and toggle reveal. */
export const WithValue: Story = {
  render: () => (
    <PasswordInput
      defaultValue="hunter2"
      placeholder="Password"
      className="w-64"
    />
  ),
};
