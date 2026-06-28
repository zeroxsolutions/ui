import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import { Toaster } from '@zeroxsolutions/ui/components/ui/sonner';
import { toast } from 'sonner';

/**
 * `Toaster` mounts the Sonner toast container, themed to follow the active color
 * scheme and preconfigured with status icons for success, info, warning, error,
 * and loading. Render it once near the root, then call `toast()` and its
 * variants from anywhere to push transient notifications. The stories pair it
 * with buttons that fire toasts on click.
 */
const meta: Meta<typeof Toaster> = {
  title: 'Primitives/Sonner',
  component: Toaster,
};
export default meta;

type Story = StoryObj<typeof Toaster>;

/** A button that fires a single neutral toast through the base `toast()` call. */
export const Default: Story = {
  render: () => (
    <div>
      <Button variant="outline" onClick={() => toast('Event has been created')}>
        Show toast
      </Button>
      <Toaster />
    </div>
  ),
};

/**
 * Contrasts the `toast.success` and `toast.error` variants, each rendering its
 * own status icon and styling.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => toast.success('Profile saved')}>
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error('Something went wrong')}
      >
        Error
      </Button>
      <Toaster />
    </div>
  ),
};
