import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor/document/core/index';
import { Editor } from '@zeroxsolutions/editor/document/react/editor';
import { standardKit } from '@zeroxsolutions/editor/document/features/standard/index';
import { math } from '@zeroxsolutions/editor/document/features/math/index';
import { MathEditor } from '@zeroxsolutions/editor/math/react/editor';
import { FormulaViewer } from '@zeroxsolutions/editor/math/react/viewer';

/**
 * The standalone math **surface** (`<MathEditor>`): a LaTeX source pane beside a
 * live KaTeX preview, with a toolbar carrying the symbol/template palette and
 * export - composed entirely from `@zeroxsolutions/ui`, no bespoke surface. The
 * in-document **block** and **inline** stories (last) reuse the same render +
 * source components behind the shared `Disclosure`/`Tabs` chrome and a `Popover` +
 * `InputGroup`.
 */
const meta: Meta<typeof MathEditor> = {
  title: 'Math Editor/Math Editor',
  component: MathEditor,
  // Render edge-to-edge so the surface reads as a real tool, matching the sibling
  // Mermaid Editor story. Each story owns its own framing wrapper.
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof MathEditor>;

const QUADRATIC = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
const SUM = '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}';
const EULER = 'e^{i\\pi} + 1 = 0';
const BROKEN = '\\frac{1}{';

/** Side-by-side source <-> preview on wide viewports. */
export const Default: Story = {
  render: () => (
    <div className="bg-background p-6">
      <MathEditor defaultValue={QUADRATIC} />
    </div>
  ),
};

/** Controlled: the host owns the source string (as with `CodeMirrorPane`). */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState(SUM);
    return (
      <div className="bg-background p-6">
        <MathEditor value={value} onValueChange={setValue} />
      </div>
    );
  },
};

/** A parse error keeps the last good render and surfaces a design-system alert. */
export const ErrorState: Story = {
  render: () => (
    <div className="bg-background p-6">
      <MathEditor defaultValue={BROKEN} />
    </div>
  ),
};

/** Empty source shows a design-system empty state, not an error. */
export const EmptyState: Story = {
  render: () => (
    <div className="bg-background p-6">
      <MathEditor defaultValue="" />
    </div>
  ),
};

/** Forced tabbed layout (also the responsive form on narrow viewports). */
export const NarrowTabs: Story = {
  render: () => (
    <div className="mx-auto max-w-sm bg-background p-6">
      <MathEditor defaultValue={QUADRATIC} layout="tabs" />
    </div>
  ),
};

/** Dark mode - the formula color flips with the `.dark` class. */
export const Dark: Story = {
  render: () => (
    <div className="dark bg-background p-6 text-foreground">
      <MathEditor defaultValue={QUADRATIC} />
    </div>
  ),
};

/** Read-only viewer - the rendered formula with no editing chrome. */
export const ReadOnlyViewer: Story = {
  render: () => (
    <div className="bg-background p-6">
      <FormulaViewer source={QUADRATIC} />
    </div>
  ),
};

/**
 * The in-document **block** - a code-block-style header (Math label + a View/Edit
 * tab control + copy) over the active tab's panel. The **Edit** tab edits the
 * source in `CodeMirrorPane` with a live preview and the palette; the **View** tab
 * renders the formula.
 */
export const InDocumentBlock: Story = {
  render: () => {
    const features = useRef([standardKit(), math()]).current;
    const [, setEditor] = useState<IEditor | null>(null);
    const content: DocJSON = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Equation' }] },
        { type: 'mathBlock', attrs: { latex: QUADRATIC } },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Switch to the Edit tab to change the source.' }],
        },
      ],
    };
    return (
      <div className="mx-auto max-w-3xl bg-background p-6 text-foreground">
        <Editor features={features} content={content} onReady={setEditor} />
      </div>
    );
  },
};

/**
 * Inline math in the text flow - click the formula to edit it in a `Popover` with
 * a compact `InputGroup` and a one-line live preview.
 */
export const InlineInDocument: Story = {
  render: () => {
    const features = useRef([standardKit(), math()]).current;
    const [, setEditor] = useState<IEditor | null>(null);
    const content: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Euler showed that ' },
            { type: 'mathInline', attrs: { latex: EULER } },
            { type: 'text', text: ', which is often called the most beautiful equation.' },
          ],
        },
      ],
    };
    return (
      <div className="mx-auto max-w-3xl bg-background p-6 text-foreground">
        <Editor features={features} content={content} onReady={setEditor} />
      </div>
    );
  },
};
