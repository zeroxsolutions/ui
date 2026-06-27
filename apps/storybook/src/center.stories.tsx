import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';

import { Badge } from '@zeroxsolutions/ui/badge';
import { Center } from '@zeroxsolutions/ui/center';

/**
 * `Center` is a layout atom that centers its children on both axes via flexbox;
 * the centering is its fixed identity, not a prop. Its single knob is `inline`,
 * which toggles block-flow (`flex`) vs inline-flow (`inline-flex`). It owns only
 * the centering classes — outer sizing, spacing, and placement come from
 * `className` — and is polymorphic through the Base UI `render` prop.
 */
const meta: Meta<typeof Center> = {
  title: 'Layouts/Center',
  component: Center,
  argTypes: {
    inline: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Center>;

/** Block-level centering: a badge centered on both axes inside a fixed-size box. */
export const Default: Story = {
  render: () => (
    <Center className="size-48 rounded-md bg-muted/50">
      <Badge>Centered</Badge>
    </Center>
  ),
};

/** The `inline` variant: an inline-flow Center keeps a badge aligned within a
 * run of text instead of breaking onto its own block. */
export const Inline: Story = {
  render: () => (
    <p className="text-sm">
      A badge{' '}
      <Center inline className="align-middle">
        <Badge variant="secondary">
          <Star className="size-3" />
        </Badge>
      </Center>{' '}
      sits inline with text.
    </p>
  ),
};

/** Polymorphic use: the `render` prop makes Center emit a `<main>` element
 * while keeping its centering behavior, leaving semantics to the consumer. */
export const AsMain: Story = {
  name: 'Polymorphic (render)',
  render: () => (
    <Center render={<main />} className="h-32 w-full rounded-md bg-muted/50">
      <Badge variant="secondary">Rendered as &lt;main&gt;</Badge>
    </Center>
  ),
};
