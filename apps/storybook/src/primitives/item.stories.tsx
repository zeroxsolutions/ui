import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserIcon } from 'lucide-react';

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@zeroxsolutions/ui/item';

const meta: Meta<typeof Item> = {
  title: 'Primitives/Item',
  component: Item,
};
export default meta;

type Story = StoryObj<typeof Item>;

export const Default: Story = {
  render: () => (
    <Item variant="outline" className="w-80">
      <ItemMedia variant="icon">
        <UserIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Account</ItemTitle>
        <ItemDescription>Manage your profile and credentials.</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const Group: Story = {
  render: () => (
    <ItemGroup className="w-80">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Ada Lovelace</ItemTitle>
          <ItemDescription>ada@zeroxsolutions.dev</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Alan Turing</ItemTitle>
          <ItemDescription>alan@zeroxsolutions.dev</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
