'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, PencilLine, Workflow } from 'lucide-react';
import { CodeEditorPane } from '@zeroxsolutions/ui/components/code-editor-pane';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@zeroxsolutions/ui/components/ui/toggle-group';
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
 * an eye/pencil view-edit `ToggleGroup` + a copy control on the right) over a body
 * that follows the toggle — the rendered diagram under the eye (`DiagramPreview`,
 * which reuses the `mermaid` surface's shared render + pan/zoom), the design
 * system's `CodeEditorPane` under the pencil. The read-only Viewer renders the
 * diagram with no edit affordance. View/edit is local view-state — never
 * persisted — so `source` stays the only attribute and the fenced ` ```mermaid `
 * codec is unchanged. Engine-free (the engine loads lazily inside the surface).
 */
const mermaidAttrs = z.object({
  source: z.string().default(DEFAULT_DIAGRAM_SOURCE),
});
type MermaidAttrs = z.infer<typeof mermaidAttrs>;

type ViewMode = 'view' | 'edit';

/** Copy the source with a transient check, mirroring the design-system code block. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? 'Copied' : 'Copy source'}
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {
            /* best-effort */
          });
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

function MermaidView({ attrs, updateAttrs, editable, selected }: NodeViewProps<MermaidAttrs>) {
  // A freshly inserted (empty) block opens ready to edit; an existing diagram
  // opens as a picture. Local view-state only — never written to the document.
  const [mode, setMode] = useState<ViewMode>(
    editable && attrs.source.trim() === '' ? 'edit' : 'view',
  );
  const type = detectDiagramType(attrs.source);

  // Read-only Viewer: the diagram, no header, no edit affordance.
  if (!editable) {
    return (
      <div className="my-4 rounded-lg border bg-card p-4" data-mermaid contentEditable={false}>
        <DiagramViewer source={attrs.source} />
      </div>
    );
  }

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
      <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Workflow className="size-4" />
          <span>{DIAGRAM_TYPE_LABEL[type]}</span>
        </div>
        <div className="flex items-center gap-1">
          <ToggleGroup
            value={[mode]}
            onValueChange={(next: unknown) => {
              const picked = (Array.isArray(next) ? next[0] : undefined) as ViewMode | undefined;
              if (picked) setMode(picked);
            }}
          >
            <ToggleGroupItem value="view" aria-label="View">
              <Eye />
            </ToggleGroupItem>
            <ToggleGroupItem value="edit" aria-label="Edit">
              <PencilLine />
            </ToggleGroupItem>
          </ToggleGroup>
          <CopyButton text={attrs.source} />
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="h-64">
          <CodeEditorPane
            value={attrs.source}
            onValueChange={(source) => updateAttrs({ source })}
            placeholder="Write Mermaid source…"
            className="h-full"
          />
        </div>
      ) : (
        <DiagramPreview source={attrs.source} className="rounded-none border-0" />
      )}
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
