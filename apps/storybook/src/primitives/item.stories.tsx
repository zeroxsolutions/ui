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

/**
 * `Item` is a composable row primitive for list-style content, assembling
 * `ItemMedia`, `ItemContent`, `ItemTitle`, and `ItemDescription` into an aligned
 * layout with `variant` (default / outline / muted) and `size` options. Wrap
 * several items in `ItemGroup` to build settings rows, contact lists, or menu
 * entries.
 */
const meta: Meta<typeof Item> = {
  title: 'Primitives/Item',
  component: Item,
};
export default meta;

type Story = StoryObj<typeof Item>;

/** Single outlined item pairing a leading icon with a title and description. */
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

/** Multiple outlined items stacked inside `ItemGroup` to form a vertical list. */
export const Group: Story = {
  render: () => (
    <ItemGroup className="w-80">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Ada Lovelace</ItemTitle>
          <ItemDescription>ada@example.com</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Alan Turing</ItemTitle>
          <ItemDescription>alan@example.com</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
