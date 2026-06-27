import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@zeroxsolutions/ui/input-otp';

/**
 * `InputOTP` is a segmented one-time-passcode field built on the `input-otp`
 * library: a single hidden input drives a row of individual character slots,
 * with an animated caret marking the active slot. Compose `InputOTPSlot`s
 * inside `InputOTPGroup`s, size the field via `maxLength`, and optionally split
 * groups with an `InputOTPSeparator`. Use it for short verification or
 * confirmation codes.
 */
const meta: Meta<typeof InputOTP> = {
  title: 'Primitives/InputOTP',
  component: InputOTP,
};
export default meta;

type Story = StoryObj<typeof InputOTP>;

/** Single six-slot group bound to local state via `value` / `onChange`. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <InputOTP maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    );
  },
};

/** Six slots split into two three-slot groups divided by an `InputOTPSeparator`. */
export const WithSeparator: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <InputOTP maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    );
  },
};
