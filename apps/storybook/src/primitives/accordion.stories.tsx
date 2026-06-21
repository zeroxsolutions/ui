import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@chiselart/ui';

const meta: Meta<typeof Accordion> = {
  title: 'Primitives/Accordion',
  component: Accordion,
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion className="w-[420px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Chisel?</AccordionTrigger>
        <AccordionContent>
          <p>
            Chisel is a design and editing toolkit for building cross-platform
            interfaces with a shared component system.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          <p>Yes. It is built on Base UI primitives that ship with full ARIA support.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I customize the theme?</AccordionTrigger>
        <AccordionContent>
          <p>Tokens drive every color, radius, and spacing value, so theming is global.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

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
