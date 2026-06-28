import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';

/**
 * `Button` is the interactive action control built on the Base UI button
 * primitive, rendering a native `<button>` by default. It exposes `variant`
 * (default, secondary, outline, ghost, destructive, link) and `size` (xs, sm,
 * default, lg, icon) props, and styles `data-icon` children as inline-start or
 * inline-end adornments.
 */
const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

/** Shows every visual `variant` side by side for comparison. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/** Walks the `size` scale from `xs` to `lg`, plus a square `icon` button. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
};

/** Demonstrates leading/trailing `data-icon` adornments and the disabled state. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        <PlusIcon data-icon="inline-start" />
        New project
      </Button>
      <Button variant="outline">
        Continue
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
