import type { Meta, StoryObj } from '@storybook/react-vite'

import { MonoChip } from '@chiselart/ui/mono-chip'

const meta: Meta<typeof MonoChip> = {
  title: 'Components/MonoChip',
  component: MonoChip,
}
export default meta

type Story = StoryObj<typeof MonoChip>

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <MonoChip>#0099ff</MonoChip>
      <MonoChip>1,024 tok</MonoChip>
      <MonoChip
        title="a-very-long-identifier-0001"
        className="max-w-24 truncate"
      >
        a-very-long-identifier-0001
      </MonoChip>
    </div>
  ),
}
