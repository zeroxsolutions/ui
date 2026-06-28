import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderRow,
  PanelHeaderTitle,
} from '@zeroxsolutions/ui/components/layouts/panel-header';

/**
 * `PanelHeader` frames the top strip of a side panel through a compound API:
 * `PanelHeaderRow`, `PanelHeaderTitle`, and `PanelHeaderActions` slot a title
 * and action controls into a fixed-height row. It renders no background of its
 * own (inheriting the parent panel's) and appends a `Separator` to divide the
 * header from the panel body.
 */
const meta: Meta<typeof PanelHeader> = {
  title: 'Layouts/PanelHeader',
  component: PanelHeader,
};
export default meta;

type Story = StoryObj<typeof PanelHeader>;

/**
 * A single-row header with a "Layers" title and a ghost icon button for panel
 * options, mounted on a card-backed container above a placeholder body to show
 * the trailing separator and inherited background.
 */
export const Default: Story = {
  render: () => (
    <div className="w-72 rounded-md bg-card ring-1 ring-foreground/10">
      <PanelHeader>
        <PanelHeaderRow>
          <PanelHeaderTitle>
            <span className="truncate text-sm font-medium">Layers</span>
          </PanelHeaderTitle>
          <PanelHeaderActions>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Panel options"
            >
              <MoreHorizontal />
            </Button>
          </PanelHeaderActions>
        </PanelHeaderRow>
      </PanelHeader>
      <div className="p-3 text-sm text-muted-foreground">panel body</div>
    </div>
  ),
};
