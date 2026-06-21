import type { Meta, StoryObj } from '@storybook/react-vite';

import { DirectionProvider, Button, ButtonGroup } from '@chiselart/ui';

/**
 * `DirectionProvider` is a non-visual Base UI context provider that sets the
 * reading direction (`ltr` / `rtl`) for descendant components. It renders no
 * DOM of its own, so the stories wrap real content to show the effect on
 * layout flow.
 */
const meta: Meta<typeof DirectionProvider> = {
  title: 'Primitives/Direction',
  component: DirectionProvider,
};
export default meta;

type Story = StoryObj<typeof DirectionProvider>;

export const LeftToRight: Story = {
  render: () => (
    <DirectionProvider direction="ltr">
      <div dir="ltr" className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">direction = "ltr"</p>
        <ButtonGroup>
          <Button variant="outline">First</Button>
          <Button variant="outline">Second</Button>
          <Button variant="outline">Third</Button>
        </ButtonGroup>
      </div>
    </DirectionProvider>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">direction = "rtl"</p>
        <ButtonGroup>
          <Button variant="outline">الأول</Button>
          <Button variant="outline">الثاني</Button>
          <Button variant="outline">الثالث</Button>
        </ButtonGroup>
      </div>
    </DirectionProvider>
  ),
};
