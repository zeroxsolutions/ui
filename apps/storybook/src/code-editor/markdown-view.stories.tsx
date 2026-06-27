import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarkdownView } from '@zeroxsolutions/ui/markdown-view';

const SAMPLE = `# PDF Toolkit

A skill that **extracts** and _summarizes_ PDF content.

## Usage

Invoke with \`/pdf <file>\`. It supports:

- Text extraction
- Table detection
- [Page ranges](https://example.com)

\`\`\`python
def extract(path: str) -> str:
    return read_pdf(path)
\`\`\`

| Feature | Status |
| --- | --- |
| Extract | done |
| OCR | wip |

> Note: large files are chunked before processing.
`;

const meta: Meta<typeof MarkdownView> = {
  title: 'Code Editor/MarkdownView',
  component: MarkdownView,
};
export default meta;

type Story = StoryObj<typeof MarkdownView>;

export const Default: Story = {
  render: () => (
    <div className="max-w-2xl rounded-lg border p-6">
      <MarkdownView>{SAMPLE}</MarkdownView>
    </div>
  ),
};

export const CodeBlocks: Story = {
  name: 'Code blocks (interactive)',
  render: () => (
    <div className="max-w-2xl rounded-lg border p-6">
      {/* `codeBlocks` swaps the plain <pre> for the interactive CodeBlock
          (hover copy button + horizontal scroll rail) — used by chat surfaces. */}
      <MarkdownView codeBlocks>{SAMPLE}</MarkdownView>
    </div>
  ),
};
