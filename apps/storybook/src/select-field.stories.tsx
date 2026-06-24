import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { SelectField } from '@chiselart/ui/select-field'

const meta: Meta<typeof SelectField> = {
  title: 'Components/SelectField',
  component: SelectField,
}
export default meta

type Story = StoryObj<typeof SelectField>

const ALIGN = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]

export const Inspector: Story = {
  render: () => {
    const [value, setValue] = useState('left')
    return (
      <div className="w-56">
        <SelectField label="Align" value={value} onValueChange={setValue} options={ALIGN} />
      </div>
    )
  },
}
