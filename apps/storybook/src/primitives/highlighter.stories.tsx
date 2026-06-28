import type { Meta, StoryObj } from '@storybook/react-vite';

import { Highlighter } from '@zeroxsolutions/ui/components/ui/highlighter';

/**
 * `Highlighter` wraps inline text in a span and draws a hand-drawn rough-notation
 * annotation over it — highlight, underline, box, circle, strike-through, and
 * more — with configurable color, stroke width, and animation. Set `isView` to
 * defer the annotation until the element scrolls into view; otherwise it renders
 * on mount and re-draws on resize.
 */
const meta: Meta<typeof Highlighter> = {
  title: 'Primitives/Highlighter',
  component: Highlighter,
};
export default meta;

type Story = StoryObj<typeof Highlighter>;

/**
 * Two inline annotations in one paragraph: a pink `highlight` and a blue
 * `underline`, each with a custom color.
 */
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
