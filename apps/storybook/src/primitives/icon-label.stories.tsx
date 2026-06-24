import type { Meta, StoryObj } from '@storybook/react-vite'

import { IconLabel } from '@chiselart/ui/icon-label'

const meta: Meta<typeof IconLabel> = {
  title: 'Primitives/IconLabel',
  component: IconLabel,
}
export default meta

type Story = StoryObj<typeof IconLabel>

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconLabel icon={RotateIcon} tip="Rotation" />
      <span className="text-sm text-muted-foreground">hover the icon</span>
    </div>
  ),
}
