import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from '@zeroxsolutions/ui/components/ui/textarea';

/**
 * `Textarea` is a styled wrapper around the native `<textarea>` element for
 * multi-line text input. It forwards all native textarea props, auto-grows to
 * fit its content via `field-sizing`, and exposes focus, `disabled`, and
 * `aria-invalid` states through theme tokens.
 */
const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
};
export default meta;

type Story = StoryObj<typeof Textarea>;

/** Default empty textarea showing placeholder text and base styling. */
export const Default: Story = {
  render: () => (
    <Textarea placeholder="Type your message here." className="w-80" />
  ),
};

/** Disabled state: non-interactive, with a not-allowed cursor and reduced opacity. */
export const Disabled: Story = {
  render: () => (
    <Textarea placeholder="Type your message here." className="w-80" disabled />
  ),
};
