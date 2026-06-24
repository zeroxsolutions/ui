import type { Meta, StoryObj } from '@storybook/react-vite'
import { Circle, Square, Triangle } from 'lucide-react'
import { useState } from 'react'

import { SplitButton } from '@chiselart/ui/split-button'

const meta: Meta<typeof SplitButton> = {
  title: 'Components/SplitButton',
  component: SplitButton,
}
export default meta

type Story = StoryObj<typeof SplitButton>

const SHAPES = [
  { value: 'rect', label: 'Rectangle', icon: Square, shortcut: 'R' },
  { value: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'O' },
  { value: 'triangle', label: 'Triangle', icon: Triangle, shortcut: 'T' },
] as const

export const ShapeTool: Story = {
  render: () => {
    const [value, setValue] = useState<(typeof SHAPES)[number]['value']>('rect')
    return (
      <div className="rounded-md border p-1">
        <SplitButton
          options={[...SHAPES]}
          value={value}
          onPrimary={() => {}}
          onValueChange={setValue}
          dropdownLabel="Shape tools"
        />
      </div>
    )
  },
}
