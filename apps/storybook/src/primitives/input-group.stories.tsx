import type { Meta, StoryObj } from '@storybook/react-vite';
import { MailIcon, SearchIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@zeroxsolutions/ui/input-group';

const meta: Meta<typeof InputGroup> = {
  title: 'Primitives/InputGroup',
  component: InputGroup,
};
export default meta;

type Story = StoryObj<typeof InputGroup>;

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
