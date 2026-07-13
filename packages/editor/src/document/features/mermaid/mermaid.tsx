'use client';

import { Eye, PencilLine, Workflow } from 'lucide-react';
import { CodeBlock } from '@zeroxsolutions/ui/components/code-block';
import { CopyButton } from '@zeroxsolutions/ui/components/copy-button';
import {
  Disclosure,
  DisclosureActions,
  DisclosureContent,
  DisclosureHeader,
  DisclosureTitle,
} from '@zeroxsolutions/ui/components/disclosure';
import { Card, CardContent } from '@zeroxsolutions/ui/components/ui/card';
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
import { CodeMirrorPane } from '../../../shared/code-mirror/index.js';
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
 * pan/zoom), the in-package `CodeMirrorPane` under **Edit**. The read-only
 * Viewer renders the diagram with no edit affordance. The active tab is local
 * view-state — never persisted — so `source` stays the only attribute and the
 * fenced ` ```mermaid ` codec is unchanged. Engine-free (the engine loads lazily
 * inside the surface).
 */
const mermaidAttrs = z.object({
  source: z.string().default(DEFAULT_DIAGRAM_SOURCE),
});
type MermaidAttrs = z.infer<typeof mermaidAttrs>;

export function MermaidView({ attrs, updateAttrs, editable, selected }: NodeViewProps<MermaidAttrs>) {
  const type = detectDiagramType(attrs.source);

  // Read-only Viewer: the diagram framed by the design-system Card, no header, no
  // edit affordance.
  if (!editable) {
    return (
      <Card size="sm" className="my-4" data-mermaid contentEditable={false}>
        <CardContent>
          <DiagramViewer source={attrs.source} />
        </CardContent>
      </Card>
    );
  }

  // A freshly inserted (empty) block opens on the Edit tab; an existing diagram
  // opens as a picture. The active tab is uncontrolled view-state (Base UI Tabs
  // owns it and mounts only the active panel) — never written to the document.
  const initialTab = attrs.source.trim() === '' ? 'edit' : 'view';

  // The header + body come from the shared `Disclosure` compound (the same chrome
  // the code-block composes) — the diagram-type label fills the title, the
  // View/Edit tabs + copy fill the actions, the active panel fills the content.
  // No collapse trigger: a Mermaid block never collapses, so `Disclosure` is used
  // for its header structure and its card container, not its toggle.
  return (
    <Disclosure
      data-mermaid
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn('my-4', selected && 'ring-2 ring-ring')}
    >
      <Tabs defaultValue={initialTab} className="gap-0">
        <DisclosureHeader>
          <DisclosureTitle>
            <Workflow className="size-4" />
            <span>{DIAGRAM_TYPE_LABEL[type]}</span>
          </DisclosureTitle>
          <DisclosureActions>
            <TabsList>
              <TabsTrigger value="view" aria-label="View">
                <Eye />
              </TabsTrigger>
              <TabsTrigger value="edit" aria-label="Edit">
                <PencilLine />
              </TabsTrigger>
            </TabsList>
            <CopyButton value={attrs.source} label="Copy source" size="icon" />
          </DisclosureActions>
        </DisclosureHeader>

        <DisclosureContent>
          <TabsContent value="view">
            <DiagramPreview source={attrs.source} className="rounded-none border-0" />
          </TabsContent>
          <TabsContent value="edit">
            <CodeMirrorPane
              value={attrs.source}
              onValueChange={(source) => updateAttrs({ source })}
              language="mermaid"
              placeholder="Write Mermaid source…"
              className="h-64"
            />
          </TabsContent>
        </DisclosureContent>
      </Tabs>
    </Disclosure>
  );
}

/** Escape the three characters that matter for `<pre>`-embedded diagram source. */
function escapeHtml(source: string): string {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const mermaidCodec: NodeCodec<MermaidAttrs> = {
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
    // static export doesn't have. Render the source through the read-only
    // design-system `CodeBlock` — Shiki-highlighted and copyable, consistent with
    // every other code block — while the live node view renders the real diagram.
    <CodeBlock
      code={String(node.attrs?.source ?? '')}
      language="mermaid"
      className="my-4"
    />
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
