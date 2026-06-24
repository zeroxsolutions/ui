import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberField } from '@chiselart/ui/number-field'

const meta: Meta<typeof NumberField> = {
  title: 'Components/NumberField',
  component: NumberField,
}
export default meta

type Story = StoryObj<typeof NumberField>

export const Inspector: Story = {
  render: () => {
    const [w, setW] = useState(240)
    const [h, setH] = useState(96)
    return (
      <div className="flex w-72 gap-2">
        <NumberField label="W" value={w} onValueChange={setW} suffix="px" min={0} />
        <NumberField label="H" value={h} onValueChange={setH} suffix="px" min={0} />
      </div>
    )
  },
}

export const Mixed: Story = {
  render: () => {
    const [value, setValue] = useState(0)
    return (
      <div className="w-40">
        {/* Multi-selection with differing values — the consumer owns the copy. */}
        <NumberField label="R" value={value} onValueChange={setValue} mixed placeholder="Mixed" />
      </div>
    )
  },
}
