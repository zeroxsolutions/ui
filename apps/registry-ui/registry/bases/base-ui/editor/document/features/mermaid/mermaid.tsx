'use client';

import { Eye, PencilLine, Workflow } from 'lucide-react';
import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
import { Card, CardContent } from '@/registry/bases/base-ui/ui/card';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '@zeroxsolutions/editor-core/document/core/index';
import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import { CodeMirrorPane } from '../../../shared/code-mirror/index.js';
import { detectDiagramType, DIAGRAM_TYPE_LABEL } from '@zeroxsolutions/editor-core/mermaid/core/detect';
import { DEFAULT_DIAGRAM_SOURCE } from '@zeroxsolutions/editor-core/mermaid/core/templates';
import { DiagramPreview } from '../../../mermaid/react/preview.js';
import { DiagramViewer } from '../../../mermaid/react/viewer.js';

/**
 * The in-document Mermaid block. A custom **atom** node holding a text `source`;
 * the node view is a **code-block-style header** (diagram-type label on the left;
 * a View/Edit `Tabs` control with icon triggers, a copy control, and the collapse
 * chevron on the right) over the active tab's panel — the rendered diagram under
 * **View** (`DiagramPreview`, which reuses the `mermaid` surface's shared render +
 * pan/zoom), the in-package `CodeMirrorPane` under **Edit**. It composes the same
 * `CollapsibleCard` chrome the read-only `CodeBlock` does — same header, same copy +
 * collapse affordances — so the two blocks read identically; only the body differs
 * (Mermaid adds the View/Edit switch and a live engine `CodeBlock` has no reason to
 * carry). The read-only Viewer renders the diagram with no edit affordance. The
 * active tab is local view-state — never persisted — so `source` stays the only
 * attribute and the fenced ` ```mermaid ` codec is unchanged. Engine-free (the
 * engine loads lazily inside the surface).
 */
const mermaidAttrs = z.object({
  source: z.string().default(DEFAULT_DIAGRAM_SOURCE),
});
type MermaidAttrs = z.infer<typeof mermaidAttrs>;

// The block's type icon is the design system's full-colour Mermaid mark — the
// same `codeLanguageIcon` resolver the code-block header uses for its language
// icon, so the two headers read identically (a brand mark, not a lucide glyph).
const MermaidTypeIcon = codeLanguageIcon('mermaid');

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

  // The header + body come from the shared `CollapsibleCard` compound in its `muted`
  // variant — the same borderless muted chrome the read-only code-block composes,
  // so the two blocks read identically: the diagram-type label fills the title; the
  // View/Edit tabs (the segmented control, 36px) plus the copy + collapse chevron
  // (the icon-action pair, 32px — matching code-block's copy+chevron grouping) fill
  // the actions; the panels fill the collapsible body.
  //
  // `CollapsibleCardContent` carries `keepMounted` so the collapse toggle only *hides* the
  // active panel (height→0) and never unmounts it. Without it, folding a block that
  // is showing the diagram would tear down the preview's `dangerouslySetInnerHTML`
  // SVG mid-render and React would crash on `removeChild`; keeping the node mounted
  // (Base UI just toggles `hidden`) sidesteps that entirely.
  return (
    <CollapsibleCard
      variant="muted"
      data-mermaid
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn('my-4', selected && 'ring-ring ring-2')}
    >
      <Tabs defaultValue={initialTab} className="gap-0">
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <MermaidTypeIcon className="shrink-0" />
            <span>{DIAGRAM_TYPE_LABEL[type]}</span>
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <TabsList>
              <TabsTrigger value="view" aria-label="View">
                <Eye />
              </TabsTrigger>
              <TabsTrigger value="edit" aria-label="Edit">
                <PencilLine />
              </TabsTrigger>
            </TabsList>
            <CopyButton value={attrs.source} label="Copy source" size="icon" />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
        <CollapsibleCardContent keepMounted>
          <Separator />
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
        </CollapsibleCardContent>
      </Tabs>
    </CollapsibleCard>
  );
}

/** Escape the three characters that matter for `<pre>`-embedded diagram source. */
function escapeHtml(source: string): string {
  return source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const mermaidCodec: NodeCodec<MermaidAttrs> = {
  node: 'mermaid',
  toMarkdown: (node) => '```mermaid\n' + String(node.attrs?.source ?? '') + '\n```',
  fromMarkdown: (token) =>
    token.type === 'code' && token.lang === 'mermaid'
      ? { type: 'mermaid', attrs: { source: String(token.value ?? '') } }
      : null,
  toHTML: (node) => `<pre class="mermaid" data-mermaid>${escapeHtml(String(node.attrs?.source ?? ''))}</pre>`,
  fromHTML: (element) =>
    element.classList.contains('mermaid') || element.hasAttribute('data-mermaid')
      ? { type: 'mermaid', attrs: { source: element.textContent ?? '' } }
      : null,
  toReact: (node) => (
    // SSR-safe fallback: Mermaid needs a live DOM to produce an SVG, which the
    // static export doesn't have. Render the source through the read-only
    // design-system `CodeBlock` — Shiki-highlighted and copyable, consistent with
    // every other code block — while the live node view renders the real diagram.
    <CodeBlock code={String(node.attrs?.source ?? '')} language="mermaid" className="my-4">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
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
