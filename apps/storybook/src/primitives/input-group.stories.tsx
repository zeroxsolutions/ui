import type { Meta, StoryObj } from '@storybook/react-vite';
import { MailIcon, SearchIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@zeroxsolutions/ui/components/ui/input-group';

/**
 * `InputGroup` wraps an input or textarea together with addon slots (icons,
 * buttons, or text) inside a single bordered control that shares focus and
 * validation styling. Place an `InputGroupAddon` before or after the
 * `InputGroupInput` to attach leading or trailing affordances; clicking an
 * addon forwards focus to the inner control.
 */
const meta: Meta<typeof InputGroup> = {
  title: 'Primitives/InputGroup',
  component: InputGroup,
};
export default meta;

type Story = StoryObj<typeof InputGroup>;

/** Leading search icon addon paired with a text input in a fixed-width group. */
export const Default: Story = {
  render: () => (
    <InputGroup className="w-64">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search…" />
    </InputGroup>
  ),
};

/** Same pattern typed for email entry, with a leading mail icon as the addon. */
export const Email: Story = {
  render: () => (
    <InputGroup className="w-64">
      <InputGroupAddon>
        <MailIcon />
      </InputGroupAddon>
      <InputGroupInput type="email" placeholder="you@example.com" />
    </InputGroup>
  ),
};
