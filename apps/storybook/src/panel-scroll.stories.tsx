import type { Meta, StoryObj } from '@storybook/react-vite';

import { PanelScroll } from '@chiselart/ui/panel-scroll';

const meta: Meta<typeof PanelScroll> = {
  title: 'Layouts/PanelScroll',
  component: PanelScroll,
};
export default meta;

type Story = StoryObj<typeof PanelScroll>;

export const Default: Story = {
  render: () => (
    <div className="h-56 w-72 rounded-md bg-card ring-1 ring-foreground/10">
      <PanelScroll>
        <div className="space-y-2 p-3">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="rounded bg-muted/60 px-2 py-1.5 text-sm">
              Row {i + 1}
            </div>
          ))}
        </div>
      </PanelScroll>
    </div>
  ),
};
