import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { TagInput } from '@chiselart/ui/tag-input'

const meta: Meta<typeof TagInput> = {
  title: 'Components/TagInput',
  component: TagInput,
}
export default meta

type Story = StoryObj<typeof TagInput>

export const Default: Story = {
  render: () => {
    const [tags, setTags] = useState(['design', 'ui'])
    return (
      <div className="w-72">
        <TagInput value={tags} onValueChange={setTags} placeholder="Add a tag…" />
      </div>
    )
  },
}
