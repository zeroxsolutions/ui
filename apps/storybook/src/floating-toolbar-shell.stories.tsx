import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@chiselart/ui/button';
import { FloatingToolbarShell } from '@chiselart/ui/floating-toolbar-shell';

const meta: Meta<typeof FloatingToolbarShell> = {
  title: 'Layouts/FloatingToolbarShell',
  component: FloatingToolbarShell,
};
export default meta;

type Story = StoryObj<typeof FloatingToolbarShell>;

export const Default: Story = {
  render: () => (
    <div className="relative h-48 w-full rounded-md bg-muted/40">
      <FloatingToolbarShell label="Canvas tools">
        <Button variant="ghost" size="icon">
          V
        </Button>
        <Button variant="ghost" size="icon">
          ▭
        </Button>
        <Button variant="ghost" size="icon">
          ◯
        </Button>
        <Button variant="ghost" size="icon">
          T
        </Button>
      </FloatingToolbarShell>
    </div>
  ),
};
