import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatusDot, type StatusTone } from '@chiselart/ui/status-dot'

const meta: Meta<typeof StatusDot> = {
  title: 'Primitives/StatusDot',
  component: StatusDot,
}
export default meta

type Story = StoryObj<typeof StatusDot>

const TONES: StatusTone[] = ['online', 'offline', 'busy', 'idle']

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
}
