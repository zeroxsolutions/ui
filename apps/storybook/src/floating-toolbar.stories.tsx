import type { Meta, StoryObj } from '@storybook/react-vite';
import { Circle, MousePointer2, Square, Type } from 'lucide-react';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import { FloatingToolbar } from '@zeroxsolutions/ui/components/layouts/floating-toolbar';

/**
 * `FloatingToolbar` is the shared chrome for an editor's on-canvas tool
 * palette: a rounded bar with the card background, blur, hairline ring and
 * shadow, rendered as a WAI-ARIA `toolbar` landmark (named via `label`). The
 * consumer owns placement through `className` and fills the bar with the tool
 * buttons that differ.
 */
const meta: Meta<typeof FloatingToolbar> = {
  title: 'Layouts/FloatingToolbar',
  component: FloatingToolbar,
};
export default meta;

type Story = StoryObj<typeof FloatingToolbar>;

/**
 * The shell absolutely positioned at the bottom-center of a mock canvas and
 * filled with four icon-button tools (move, rectangle, ellipse, text) to show
 * typical toolbar content and consumer-owned placement.
 */
export const Default: Story = {
  render: () => (
    <div className="relative h-48 w-full rounded-md bg-muted/40">
      <FloatingToolbar
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
      </FloatingToolbar>
    </div>
  ),
};
