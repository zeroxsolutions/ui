import type { Meta, StoryObj } from '@storybook/react-vite';

import { CodeBlock } from '@chiselart/ui/code-block';

const JSON_SAMPLE = JSON.stringify(
  { tool: 'search', query: 'design tokens', results: 3, ok: true },
  null,
  2,
);

const LONG_LINE =
  'https://example.com/a/very/long/path/that/overflows?token=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

const TS_SAMPLE = `import { CATALOG } from './catalog';

// resolve a model from the catalog by id
export async function resolveModel(id: string): Promise<Model | null> {
  const model = CATALOG.find((m) => m.id === id);
  if (!model) return null;
  const ready = model.weights > 0 && !model.deprecated;
  return { ...model, ready, label: \`\${model.name} (v\${model.version})\` };
}`;

const PY_SAMPLE = `import math
from typing import Optional

# clamp a value into [lo, hi]
def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Return x bounded to the range."""
    if x is None:
        return 0.0
    return max(lo, min(hi, x))`;

const meta: Meta<typeof CodeBlock> = {
  title: 'AI Elements/CodeBlock',
  component: CodeBlock,
};
export default meta;

type Story = StoryObj<typeof CodeBlock>;

export const TypeScript: Story = {
  name: 'Highlighted (language header + colors)',
  render: () => (
    <div className="max-w-lg">
      {/* A real language → file-type icon + label header, Shiki-highlighted body
          painted with the brand `--code-*` palette. */}
      <CodeBlock code={TS_SAMPLE} language="ts" />
    </div>
  ),
};

export const Python: Story = {
  render: () => (
    <div className="max-w-lg">
      <CodeBlock code={PY_SAMPLE} language="python" />
    </div>
  ),
};

export const Json: Story = {
  render: () => (
    <div className="max-w-md">
      <CodeBlock code={JSON_SAMPLE} language="json" />
    </div>
  ),
};

export const PlainText: Story = {
  name: 'No language (plain, hover copy)',
  render: () => (
    <div className="max-w-md">
      {/* No language → no header; the copy button reveals on hover. */}
      <CodeBlock code={'just some plain text\nwith two lines'} />
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
