import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@zeroxsolutions/ui/bubble';

/**
 * `Bubble` is a compound chat-bubble primitive. `Bubble` is the wrapper that
 * carries the `variant` and `align` (`start` / `end`) state, `BubbleContent`
 * renders the visible message body (it inherits color from the parent
 * variant), `BubbleGroup` stacks consecutive bubbles in a column, and
 * `BubbleReactions` is an absolutely positioned chip for reaction summaries.
 * Use it to compose message threads where the sender is distinguished by
 * variant and alignment.
 */
const meta: Meta<typeof Bubble> = {
  title: 'Primitives/Bubble',
  component: Bubble,
};
export default meta;

type Story = StoryObj<typeof Bubble>;

/** Every `variant` shown together so the surface treatments can be compared. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-3">
      <Bubble>
        <BubbleContent>Default</BubbleContent>
      </Bubble>
      <Bubble variant="secondary">
        <BubbleContent>Secondary</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Muted</BubbleContent>
      </Bubble>
      <Bubble variant="tinted">
        <BubbleContent>Tinted</BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent>Outline</BubbleContent>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>Ghost</BubbleContent>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>Destructive</BubbleContent>
      </Bubble>
    </div>
  ),
};

/**
 * A `BubbleGroup` stacking consecutive bubbles from the same sender into a
 * single vertical run with consistent spacing.
 */
export const Group: Story = {
  render: () => (
    <BubbleGroup className="w-80">
      <Bubble variant="muted">
        <BubbleContent>Are we still on for the review at 3?</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>I pushed the latest changes already.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Let me know if anything looks off.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
};

/**
 * `align="end"` pushes the bubble to the trailing edge of its container, the
 * convention for messages sent by the current user.
 */
export const EndAligned: Story = {
  render: () => (
    <BubbleGroup className="w-80">
      <Bubble variant="muted">
        <BubbleContent>How did the deploy go?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>All green, shipping now.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
};

/**
 * `BubbleReactions` overlays a reaction chip on a bubble; it is positioned via
 * `side` (`top` / `bottom`) and `align` (`start` / `end`) relative to the
 * bubble it annotates.
 */
export const WithReactions: Story = {
  render: () => (
    <BubbleGroup className="w-80">
      <Bubble variant="muted" className="mb-3">
        <BubbleContent>Final draft is ready for sign-off.</BubbleContent>
        <BubbleReactions>👍 3</BubbleReactions>
      </Bubble>
    </BubbleGroup>
  ),
};
