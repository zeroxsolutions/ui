import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusDot, type StatusTone } from '@zeroxsolutions/ui/components/status-dot';

/**
 * `StatusDot` is a small presence indicator — a coloured circle that signals a
 * binary/presence state from a semantic `tone` (`online`, `offline`, `busy`,
 * `idle`) rather than a raw colour, so it reads the same on every surface. It is
 * `aria-hidden`, so pair it with a visible label, and set `pulse` to animate a
 * "connecting"/"live" state.
 */
const meta: Meta<typeof StatusDot> = {
  title: 'Components/StatusDot',
  component: StatusDot,
};
export default meta;

type Story = StoryObj<typeof StatusDot>;

const TONES: StatusTone[] = ['online', 'offline', 'busy', 'idle'];

/** Every tone stacked with its label, plus an `online` dot with `pulse` enabled. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm">
      {TONES.map((tone) => (
        <div key={tone} className="flex items-center gap-2">
          <StatusDot tone={tone} />
          <span>{tone}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <StatusDot tone="online" pulse />
        <span>online · pulse</span>
      </div>
    </div>
  ),
};
