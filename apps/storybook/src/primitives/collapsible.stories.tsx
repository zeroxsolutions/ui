import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@zeroxsolutions/ui/collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Primitives/Collapsible',
  component: Collapsible,
};
export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-72">
      <CollapsibleTrigger
        render={<Button variant="outline" className="w-full justify-between" />}
      >
        Toggle details
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-md bg-muted p-3 text-sm">
        This content is revealed when the collapsible is open. Base UI animates
        the panel height between the open and closed states.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-72">
      <CollapsibleTrigger
        render={<Button variant="outline" className="w-full justify-between" />}
      >
        Notifications
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 flex flex-col gap-2 text-sm">
        <div className="rounded-md bg-muted p-2">Email alerts</div>
        <div className="rounded-md bg-muted p-2">Push notifications</div>
        <div className="rounded-md bg-muted p-2">Weekly digest</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
