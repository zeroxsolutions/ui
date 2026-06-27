import type { Meta, StoryObj } from '@storybook/react-vite';

import { DeepgramMark } from '@zeroxsolutions/icons/deepgram';
import { GithubMark } from '@zeroxsolutions/icons/github-mark';
import { InworldMark } from '@zeroxsolutions/icons/inworld';
import { LeonardoMark } from '@zeroxsolutions/icons/leonardo';
import { PipecatMark } from '@zeroxsolutions/icons/pipecat';

/**
 * Visual catalog of the vendored brand marks shipped by `@zeroxsolutions/icons`
 * — the marks `@lobehub/icons` doesn't carry. `GithubMark` is sized and coloured
 * via `className` (it paints with `currentColor`); the provider marks mirror the
 * `@lobehub/icons` color-mark API (`size="1em"`, scaled by the parent font-size).
 */
const meta: Meta = {
  title: 'Icons/Brand Marks',
};
export default meta;

type Story = StoryObj;

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-28 flex-col items-center gap-2 rounded-lg border p-4">
      <div className="flex h-10 items-center justify-center text-3xl">
        {children}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Every vendored mark rendered in a labelled grid, demonstrating both sizing
 * APIs: `currentColor` via `className` and the font-relative `size="1em"`.
 */
export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {/* currentColor mark — inherits the surrounding text colour. */}
      <Cell label="GithubMark">
        <GithubMark className="size-7" />
      </Cell>
      {/* lobehub-style size API marks (1em → scales with the cell font-size). */}
      <Cell label="DeepgramMark">
        <DeepgramMark size="1em" />
      </Cell>
      <Cell label="InworldMark">
        <InworldMark size="1em" />
      </Cell>
      <Cell label="LeonardoMark">
        <LeonardoMark size="1em" />
      </Cell>
      <Cell label="PipecatMark">
        <PipecatMark size="1em" />
      </Cell>
    </div>
  ),
};
