import type { Meta, StoryObj } from '@storybook/react-vite';

import { Highlighter } from '@chiselart/ui/highlighter';

const meta: Meta<typeof Highlighter> = {
  title: 'Primitives/Highlighter',
  component: Highlighter,
};
export default meta;

type Story = StoryObj<typeof Highlighter>;

export const Default: Story = {
  render: () => (
    <p className="max-w-sm text-lg leading-loose">
      The quick brown{' '}
      <Highlighter action="highlight" color="#ffd1dc">
        fox jumps
      </Highlighter>{' '}
      over the{' '}
      <Highlighter action="underline" color="#0099ff">
        lazy dog
      </Highlighter>
      .
    </p>
  ),
};
