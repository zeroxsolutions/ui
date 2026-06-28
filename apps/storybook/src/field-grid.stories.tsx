import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldGrid } from '@zeroxsolutions/ui/components/layouts/field-grid';
import { Input } from '@zeroxsolutions/ui/components/ui/input';

/**
 * `FieldGrid` is a tight CSS grid wrapper for paired or triplet inputs (X+Y,
 * W+H, count+gutter+margin). It bakes a fixed `gap-x-2 gap-y-1` spacing so
 * property sections stay consistent, and takes the column count from the `cols`
 * prop (a computed `grid-template-columns: repeat(n, …)`) or from a
 * `grid-cols-*` utility passed via `className`. These stories drive the columns
 * through `className`.
 */
const meta: Meta<typeof FieldGrid> = {
  title: 'Layouts/FieldGrid',
  component: FieldGrid,
};
export default meta;

type Story = StoryObj<typeof FieldGrid>;

/** Two-column layout driven by a `grid-cols-2` utility; four inputs wrap into a 2×2 grid. */
export const TwoColumns: Story = {
  render: () => (
    <div className="w-64">
      <FieldGrid className="grid-cols-2">
        <Input placeholder="X" />
        <Input placeholder="Y" />
        <Input placeholder="W" />
        <Input placeholder="H" />
      </FieldGrid>
    </div>
  ),
};

/** Three-column layout via `grid-cols-3`; three inputs sit in a single row. */
export const ThreeColumns: Story = {
  render: () => (
    <div className="w-72">
      <FieldGrid className="grid-cols-3">
        <Input placeholder="Count" />
        <Input placeholder="Gutter" />
        <Input placeholder="Margin" />
      </FieldGrid>
    </div>
  ),
};
