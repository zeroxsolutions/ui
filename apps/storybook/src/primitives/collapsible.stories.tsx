import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@zeroxsolutions/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@zeroxsolutions/ui/collapsible';

/**
 * `Collapsible` is a Base UI disclosure that shows or hides a content panel in
 * response to its trigger, animating the panel height between open and closed.
 * Compose `CollapsibleTrigger` (rendered here as a `Button`) with
 * `CollapsibleContent` to wrap the toggleable region. Use it for optional or
 * secondary content that should stay collapsed until the user expands it.
 */
const meta: Meta<typeof Collapsible> = {
  title: 'Primitives/Collapsible',
  component: Collapsible,
};
export default meta;

type Story = StoryObj<typeof Collapsible>;

/** Closed by default; activating the trigger reveals the animated content panel. */
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

/** Starts expanded via `defaultOpen`, showing a stacked list of panel items on load. */
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
