import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@chiselart/ui/button';
import {
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderRow,
  PanelHeaderTitle,
} from '@chiselart/ui/panel-header';

const meta: Meta<typeof PanelHeader> = {
  title: 'Layouts/PanelHeader',
  component: PanelHeader,
};
export default meta;

type Story = StoryObj<typeof PanelHeader>;

export const Default: Story = {
  render: () => (
    <div className="w-72 rounded-md bg-card ring-1 ring-foreground/10">
      <PanelHeader>
        <PanelHeaderRow>
          <PanelHeaderTitle>
            <span className="truncate text-sm font-medium">Layers</span>
          </PanelHeaderTitle>
          <PanelHeaderActions>
            <Button variant="ghost" size="icon" className="size-6">
              »
            </Button>
          </PanelHeaderActions>
        </PanelHeaderRow>
      </PanelHeader>
      <div className="p-3 text-sm text-muted-foreground">panel body</div>
    </div>
  ),
};
