import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import { Toaster } from '@zeroxsolutions/ui/sonner';
import { toast } from 'sonner';

const meta: Meta<typeof Toaster> = {
  title: 'Primitives/Sonner',
  component: Toaster,
};
export default meta;

type Story = StoryObj<typeof Toaster>;

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
