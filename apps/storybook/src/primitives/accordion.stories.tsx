import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@zeroxsolutions/ui/accordion';

/**
 * `Accordion` is a vertically stacked set of expandable disclosure items built on
 * Base UI accordion primitives, composed from `Accordion`, `AccordionItem`,
 * `AccordionTrigger`, and `AccordionContent`. Use it to collapse long-form
 * content into headers that toggle their panels; by default only one panel stays
 * open, and `multiple` allows several to expand at once.
 */
const meta: Meta<typeof Accordion> = {
  title: 'Primitives/Accordion',
  component: Accordion,
};
export default meta;

type Story = StoryObj<typeof Accordion>;

/** Single-open default: opening one item collapses the others, with three items. */
export const Default: Story = {
  render: () => (
    <Accordion className="w-[420px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is this design toolkit?</AccordionTrigger>
        <AccordionContent>
          <p>
            This design toolkit builds cross-platform interfaces with a shared
            component system.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes. It is built on Base UI primitives that ship with full ARIA
            support.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I customize the theme?</AccordionTrigger>
        <AccordionContent>
          <p>
            Tokens drive every color, radius, and spacing value, so theming is
            global.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** `multiple` with `defaultValue` so several panels stay expanded simultaneously. */
export const MultipleOpen: Story = {
  render: () => (
    <Accordion className="w-[420px]" multiple defaultValue={['a', 'b']}>
      <AccordionItem value="a">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>
          <p>Multiple panels can stay open at the same time.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>
          <p>Both of these are expanded by default.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
