import type { Meta, StoryObj } from '@storybook/react-vite';

import { GithubMark } from '@chiselart/icons/github-mark';
import { AI4BharatMark } from '@chiselart/icons/ai4bharat';
import { DeepgramMark } from '@chiselart/icons/deepgram';
import { InworldMark } from '@chiselart/icons/inworld';
import { LeonardoMark } from '@chiselart/icons/leonardo';
import { PipecatMark } from '@chiselart/icons/pipecat';

/** Visual catalog of the vendored brand marks shipped by @chiselart/icons —
 *  brands @lobehub/icons doesn't carry. github-mark is sized/coloured via
 *  `className` (currentColor); the provider marks mirror the @lobehub/icons
 *  color-mark API (`size="1em"`, scaled by the parent font-size). */
const meta: Meta = {
  title: 'Icons/Brand Marks',
};
export default meta;

type Story = StoryObj;

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-28 flex-col items-center gap-2 rounded-lg border p-4">
      <div className="flex h-10 items-center justify-center text-3xl">
        {children}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

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
      <Cell label="AI4BharatMark">
        <AI4BharatMark size="1em" />
      </Cell>
    </div>
  ),
};
