import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '@zeroxsolutions/ui/badge';
import { CheckIcon } from 'lucide-react';

/**
 * `Badge` is a small inline label for statuses, counts, or categories, offered
 * in six visual variants (`default`, `secondary`, `destructive`, `outline`,
 * `ghost`, `link`). It renders as a `<span>` by default but can adopt any
 * element through the polymorphic `render` prop, and pairs with icons marked
 * `data-icon="inline-start"` / `"inline-end"` for balanced spacing.
 */
const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

/** Lines up all six visual variants for side-by-side comparison. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
};

/** Pairs a badge with a leading icon (`data-icon="inline-start"`) and renders a second badge as an anchor through the `render` prop. */
export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        <CheckIcon data-icon="inline-start" />
        Verified
      </Badge>
      <Badge render={<a href="#" />}>Linked badge</Badge>
    </div>
  ),
};
