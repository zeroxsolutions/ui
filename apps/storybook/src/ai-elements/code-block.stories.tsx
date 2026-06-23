import type { Meta, StoryObj } from '@storybook/react-vite';

import { CodeBlock } from '@chiselart/ui/code-block';

const JSON_SAMPLE = JSON.stringify(
  { tool: 'search', query: 'design tokens', results: 3, ok: true },
  null,
  2,
);

const LONG_LINE =
  'https://example.com/a/very/long/path/that/overflows?token=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

const meta: Meta<typeof CodeBlock> = {
  title: 'AI Elements/CodeBlock',
  component: CodeBlock,
};
export default meta;

type Story = StoryObj<typeof CodeBlock>;

export const Json: Story = {
  render: () => (
    <div className="max-w-md">
      <CodeBlock code={JSON_SAMPLE} language="json" />
    </div>
  ),
};

export const HorizontalScroll: Story = {
  name: 'Overflowing line (scroll rail)',
  render: () => (
    <div className="max-w-md">
      {/* A single long line overflows sideways; the thin horizontal rail appears
          only while the line is too wide to fit. */}
      <CodeBlock code={LONG_LINE} />
    </div>
  ),
};
