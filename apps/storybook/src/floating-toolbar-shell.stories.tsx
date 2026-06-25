import type { Meta, StoryObj } from '@storybook/react-vite';
import { Circle, MousePointer2, Square, Type } from 'lucide-react';

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
      <FloatingToolbarShell
        label="Canvas tools"
        className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2"
      >
        <Button variant="ghost" size="icon" aria-label="Move">
          <MousePointer2 />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Rectangle">
          <Square />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Ellipse">
          <Circle />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Text">
          <Type />
        </Button>
      </FloatingToolbarShell>
    </div>
  ),
};
