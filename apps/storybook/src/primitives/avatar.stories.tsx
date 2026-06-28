import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@zeroxsolutions/ui/components/ui/avatar';

/**
 * `Avatar` is a Base UI avatar that renders a circular user image and
 * automatically swaps to fallback initials when the image is missing or fails
 * to load. Compose it from `AvatarImage`, `AvatarFallback`, and an optional
 * `AvatarBadge` for status; use `AvatarGroup` with `AvatarGroupCount` to stack
 * several avatars behind an overflow count. The `size` prop selects `sm`,
 * `default`, or `lg`.
 */
const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
};
export default meta;

type Story = StoryObj<typeof Avatar>;

/** Shows the three avatar sizes side by side (`sm`, `default`, `lg`): the medium avatar loads an image while the others fall back to initials, and the large one adds a status `AvatarBadge`. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://placehold.co/80x80" alt="User avatar" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>TU</AvatarFallback>
        <AvatarBadge />
      </Avatar>
    </div>
  ),
};

/** Stacks several avatars with `AvatarGroup` and caps the overflow with `AvatarGroupCount` (`+5`), using fallback initials for each member. */
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>EF</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  ),
};
