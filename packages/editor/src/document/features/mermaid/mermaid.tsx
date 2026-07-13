'use client';

import { Eye, PencilLine, Workflow } from 'lucide-react';
import { CodeEditorPane } from '@zeroxsolutions/ui/components/code-editor-pane';
import { CopyButton } from '@zeroxsolutions/ui/components/copy-button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@zeroxsolutions/ui/components/ui/tabs';
import { cn } from '@zeroxsolutions/ui/lib/utils';
import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeViewProps } from '../../core/index.js';
import { detectDiagramType, DIAGRAM_TYPE_LABEL } from '../../../mermaid/core/detect.js';
import { DEFAULT_DIAGRAM_SOURCE } from '../../../mermaid/core/templates.js';
import { DiagramPreview } from '../../../mermaid/react/preview.js';
import { DiagramViewer } from '../../../mermaid/react/viewer.js';

/**
 * The in-document Mermaid block. A custom **atom** node holding a text `source`;
 * the node view is a **code-block-style header** (diagram-type label on the left;
 * a View/Edit `Tabs` control with icon triggers + a copy control on the right)
 * over the active tab's panel — the rendered diagram under **View**
 * (`DiagramPreview`, which reuses the `mermaid` surface's shared render +
 * pan/zoom), the design system's `CodeEditorPane` under **Edit**. The read-only
 * Viewer renders the diagram with no edit affordance. The active tab is local
 * view-state — never persisted — so `source` stays the only attribute and the
 * fenced ` ```mermaid ` codec is unchanged. Engine-free (the engine loads lazily
 * inside the surface).
 */
const mermaidAttrs = z.object({
  source: z.string().default(DEFAULT_DIAGRAM_SOURCE),
});
type MermaidAttrs = z.infer<typeof mermaidAttrs>;

function MermaidView({ attrs, updateAttrs, editable, selected }: NodeViewProps<MermaidAttrs>) {
  const type = detectDiagramType(attrs.source);

  // Read-only Viewer: the diagram, no header, no edit affordance.
  if (!editable) {
    return (
      <div className="my-4 rounded-lg border bg-card p-4" data-mermaid contentEditable={false}>
        <DiagramViewer source={attrs.source} />
      </div>
    );
  }

  // A freshly inserted (empty) block opens on the Edit tab; an existing diagram
  // opens as a picture. The active tab is uncontrolled view-state (Base UI Tabs
  // owns it and mounts only the active panel) — never written to the document.
  const initialTab = attrs.source.trim() === '' ? 'edit' : 'view';

  return (
    <div
      data-mermaid
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        'my-4 overflow-hidden rounded-lg border bg-card',
        selected && 'ring-2 ring-ring',
      )}
    >
      <Tabs defaultValue={initialTab} className="gap-0">
        <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Workflow className="size-4" />
            <span>{DIAGRAM_TYPE_LABEL[type]}</span>
          </div>
          <div className="flex items-center gap-1">
            <TabsList>
              <TabsTrigger value="view" aria-label="View">
                <Eye />
              </TabsTrigger>
              <TabsTrigger value="edit" aria-label="Edit">
                <PencilLine />
              </TabsTrigger>
            </TabsList>
            <CopyButton value={attrs.source} label="Copy source" size="icon" />
          </div>
        </div>

        <TabsContent value="view">
          <DiagramPreview source={attrs.source} className="rounded-none border-0" />
        </TabsContent>
        <TabsContent value="edit">
          <CodeEditorPane
            value={attrs.source}
            onValueChange={(source) => updateAttrs({ source })}
            placeholder="Write Mermaid source…"
            className="h-64"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Escape the three characters that matter for `<pre>`-embedded diagram source. */
function escapeHtml(source: string): string {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const mermaidCodec: NodeCodec<MermaidAttrs> = {
  node: 'mermaid',
  toMarkdown: (node) => '```mermaid\n' + String(node.attrs?.source ?? '') + '\n```',
  fromMarkdown: (token) =>
    token.type === 'code' && token.lang === 'mermaid'
      ? { type: 'mermaid', attrs: { source: String(token.value ?? '') } }
      : null,
  toHTML: (node) =>
    `<pre class="mermaid" data-mermaid>${escapeHtml(
      String(node.attrs?.source ?? ''),
    )}</pre>`,
  fromHTML: (element) =>
    element.classList.contains('mermaid') || element.hasAttribute('data-mermaid')
      ? { type: 'mermaid', attrs: { source: element.textContent ?? '' } }
      : null,
  toReact: (node) => (
    // SSR-safe fallback: Mermaid needs a live DOM to produce an SVG, which the
    // static server-side Viewer doesn't have. Emit the raw source in a
    // `pre.mermaid` — the live Editor/Viewer node view renders the real diagram,
    // while the static export shows the readable source.
    <pre className="mermaid my-4 overflow-x-auto rounded-lg border bg-card p-4 text-sm">
      {String(node.attrs?.source ?? '')}
    </pre>
  ),
};

export function mermaid(): EditorFeature {
  return defineFeature({
    id: 'mermaid',
    nodes: [
      {
        name: 'mermaid',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        attrs: mermaidAttrs,
        render: MermaidView,
      },
    ],
    codecs: [mermaidCodec as NodeCodec],
    commands: {
      insertMermaid: {
        args: z.object({ source: z.string() }).optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            // A slash insert (no args) seeds an empty diagram, so the block opens
            // ready to edit; a programmatic caller passes its own source.
            content: {
              type: 'mermaid',
              attrs: { source: args?.source ?? '' },
            },
          }),
      },
    },
    slash: [
      {
        id: 'mermaid',
        icon: <Workflow className="size-4" />,
        title: 'Mermaid',
        description: 'Diagram from text',
        group: 'Blocks',
        keywords: ['mermaid', 'diagram', 'flowchart', 'graph'],
        command: 'insertMermaid',
      },
    ],
  });
}
