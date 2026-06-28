import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@zeroxsolutions/ui/components/ui/input';
import { LabeledControl } from '@zeroxsolutions/ui/components/layouts/labeled-control';

/**
 * `LabeledControl` is the compact inspector field: a vertical `Field` with a
 * dense `text-xs` muted label above a full-width control that carries no inline
 * label of its own (a colour swatch, a custom picker). It composes `Field` +
 * `FieldLabel` so the label is a real label slot rather than a hand-rolled span.
 */
const meta: Meta<typeof LabeledControl> = {
  title: 'Layouts/LabeledControl',
  component: LabeledControl,
};
export default meta;

type Story = StoryObj<typeof LabeledControl>;

/**
 * Two labelled controls — a colour swatch and a text input — stacked to show
 * the label sitting above an arbitrary full-width control.
 */
export const Default: Story = {
  render: () => (
    <div className="w-56 space-y-3">
      <LabeledControl label="Fill">
        <div className="h-8 rounded bg-primary ring-1 ring-foreground/10" />
      </LabeledControl>
      <LabeledControl label="Name">
        <Input placeholder="Untitled" />
      </LabeledControl>
    </div>
  ),
};
