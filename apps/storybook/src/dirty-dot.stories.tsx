import type { Meta, StoryObj } from '@storybook/react-vite';

import { DirtyDot } from '@zeroxsolutions/ui/dirty-dot';

/**
 * `DirtyDot` is a small filled circle that marks unsaved changes — the dot an
 * editor shows on a modified tab. It renders a single labelled `span` with no
 * affordances of its own, so the stories pair it with a filename to give it
 * context.
 */
const meta: Meta<typeof DirtyDot> = {
  title: 'Components/DirtyDot',
  component: DirtyDot,
};
export default meta;

type Story = StoryObj<typeof DirtyDot>;

/** The dot beside a filename label, the way an editor flags an unsaved tab. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm">
      <DirtyDot />
      <span>file.ts — unsaved</span>
    </div>
  ),
};
