import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor/document/core/index';
import { Editor } from '@zeroxsolutions/editor/document/react/editor';
import { standardKit } from '@zeroxsolutions/editor/document/features/standard/index';
import { mermaid } from '@zeroxsolutions/editor/document/features/mermaid/index';
import { MermaidEditor } from '@zeroxsolutions/editor/mermaid/react/editor';
import { DiagramViewer } from '@zeroxsolutions/editor/mermaid/react/viewer';

/**
 * The standalone Mermaid **surface** (`<MermaidEditor>`): a source pane beside a
 * live pan/zoom preview, with a toolbar for the diagram type, templates, and
 * export — composed from `@zeroxsolutions/ui`, only the pan/zoom viewport bespoke.
 * The in-document **block** (last story) reuses the same render + source
 * components behind a code-block-style header with a View/Edit tab control.
 */
const meta: Meta<typeof MermaidEditor> = {
  title: 'Document Editor/Mermaid Editor',
  component: MermaidEditor,
  // Render edge-to-edge (no Storybook canvas padding) so the editor surface reads
  // as a real full-page tool, not a small boxed widget — matching the sibling
  // Editor/Viewer stories. Each story owns its own framing wrapper.
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof MermaidEditor>;

const FLOWCHART = 'flowchart TD\n  A[Start] --> B{OK?}\n  B -->|yes| C[Do]\n  B -->|no| D[Stop]';
const SEQUENCE =
  'sequenceDiagram\n  participant A as Alice\n  participant B as Bob\n  A->>B: Hello\n  B-->>A: Hi';
const CLASS = 'classDiagram\n  class Animal {\n    +String name\n    +move()\n  }\n  Animal <|-- Dog';
const BROKEN = 'flowchart TD\n  A[Start] -->\n  B{{ oops';

/** Side-by-side source ↔ preview on wide viewports. */
export const Default: Story = {
  render: () => (
    <div className="bg-background p-6">
      <MermaidEditor defaultValue={FLOWCHART} />
    </div>
  ),
};

/** Controlled: the host owns the source string (as with `CodeEditorPane`). */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState(SEQUENCE);
    return (
      <div className="bg-background p-6">
        <MermaidEditor value={value} onValueChange={setValue} />
      </div>
    );
  },
};

/** A class diagram — the toolbar reflects the detected type. */
export const ClassDiagram: Story = {
  render: () => (
    <div className="bg-background p-6">
      <MermaidEditor defaultValue={CLASS} />
    </div>
  ),
};

/** A parse error keeps the last good render and surfaces a design-system alert. */
export const ErrorState: Story = {
  render: () => (
    <div className="bg-background p-6">
      <MermaidEditor defaultValue={BROKEN} />
    </div>
  ),
};

/** Forced tabbed layout (also the responsive form on narrow viewports). */
export const NarrowTabs: Story = {
  render: () => (
    <div className="mx-auto max-w-sm bg-background p-6">
      <MermaidEditor defaultValue={FLOWCHART} layout="tabs" />
    </div>
  ),
};

/** Dark mode — the diagram theme flips with the `.dark` class. */
export const Dark: Story = {
  render: () => (
    <div className="dark bg-background p-6 text-foreground">
      <MermaidEditor defaultValue={FLOWCHART} />
    </div>
  ),
};

/** Read-only viewer — the rendered diagram with no editing chrome. */
export const ReadOnlyViewer: Story = {
  render: () => (
    <div className="bg-background p-6">
      <DiagramViewer source={FLOWCHART} />
    </div>
  ),
};

/**
 * The in-document **block** — a code-block-style header (diagram type + a View/Edit
 * tab control + copy) over the active tab's panel. The **Edit** tab edits the
 * source in `CodeEditorPane`; the **View** tab renders the diagram.
 */
export const InDocumentBlock: Story = {
  render: () => {
    const features = useRef([standardKit(), mermaid()]).current;
    const [, setEditor] = useState<IEditor | null>(null);
    const content: DocJSON = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Diagram' }] },
        { type: 'mermaid', attrs: { source: FLOWCHART } },
        { type: 'paragraph', content: [{ type: 'text', text: 'Switch to the Edit tab to change the source.' }] },
      ],
    };
    return (
      <div className="mx-auto max-w-3xl bg-background p-6 text-foreground">
        <Editor features={features} content={content} onReady={setEditor} />
      </div>
    );
  },
};
