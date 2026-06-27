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

/**
 * `MarkdownView` renders a Markdown string (GitHub-Flavored: tables, task lists,
 * strikethrough, autolinks) styled to the design tokens. It is read-only and does
 * not render raw embedded HTML, so it is safe for untrusted content such as
 * streamed chat messages. Set `codeBlocks` to swap the plain `<pre>` for the
 * interactive code block with a copy button and horizontal scroll rail.
 */
const meta: Meta<typeof MarkdownView> = {
  title: 'Code Editor/MarkdownView',
  component: MarkdownView,
};
export default meta;

type Story = StoryObj<typeof MarkdownView>;

/** Default read-only render: GFM headings, lists, a link, a table, a blockquote, and a fenced code block as a plain styled `<pre>`. */
export const Default: Story = {
  render: () => (
    <div className="max-w-2xl rounded-lg border p-6">
      <MarkdownView>{SAMPLE}</MarkdownView>
    </div>
  ),
};

/**
 * The same source with `codeBlocks` enabled: fenced code renders as the
 * interactive `CodeBlock` (hover copy button + horizontal scroll rail), the
 * variant chat surfaces opt into, while inline code stays a muted chip.
 */
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
