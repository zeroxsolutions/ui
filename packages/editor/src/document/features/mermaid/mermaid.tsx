import { useEffect, useId, useRef, useState } from 'react';
import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeViewProps } from '../../core/index.js';
import { useEditorTheme } from '../../../shared/theme/editor-theme-context.js';

/**
 * A Mermaid diagram block — a custom **atom** node that renders a diagram from a
 * text `source` attribute. Serves as the worked example for a leaf/atom feature:
 * declarative `NodeSpec` + a React `render` view that **lazy-loads** the heavy
 * `mermaid` engine only in the browser + a two-way `NodeCodec` using the
 * GitHub/mermaid-cli fenced-``` ```mermaid ``` ```-block convention + slash — all
 * engine-free (no `@tiptap/*` / `prosemirror-*` import; `mermaid` is `import()`ed
 * inside an effect, never at module top).
 */
const DEFAULT_SOURCE = 'graph TD;\n  A-->B;';

const mermaidAttrs = z.object({
  source: z.string().default(DEFAULT_SOURCE),
});
type MermaidAttrs = z.infer<typeof mermaidAttrs>;

function MermaidView({ attrs, updateAttrs, editable }: NodeViewProps<MermaidAttrs>) {
  // The JS-side Mermaid theme values (theme name + themeVariables) don't ride the
  // CSS `.dark` flip, so they come from the active editor theme's variant.
  const { variant } = useEditorTheme();
  const mermaidTheme = variant.mermaid;

  // `useId()` gives a render-stable unique id without `Math.random()`/`Date.now()`
  // (unavailable in some SSR/hydration contexts). Sanitize it — React ids carry
  // colons/guillemets that are invalid inside an SVG element id.
  const reactId = useId();
  const diagramId = `zerox-mermaid-${reactId.replace(/[^a-zA-Z0-9-]/g, '')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(attrs.source);

  // Keep the draft in sync when the attribute changes from outside the view.
  useEffect(() => {
    setDraft(attrs.source);
  }, [attrs.source]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Lazy `import()` keeps the large `mermaid` engine out of the core bundle;
        // it loads only when a diagram actually renders in a browser.
        const mermaidEngine = (await import('mermaid')).default;
        mermaidEngine.initialize({
          startOnLoad: false,
          // The theme string is one of Mermaid's built-in theme ids; the engine's
          // config type is only known behind the lazy import, so widen here.
          theme: mermaidTheme.theme as never,
          themeVariables: mermaidTheme.themeVariables,
        });
        const { svg: rendered } = await mermaidEngine.render(diagramId, attrs.source);
        if (cancelled) return;
        setError(null);
        setSvg(rendered);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attrs.source, diagramId, mermaidTheme]);

  const commit = () => {
    if (draft !== attrs.source) updateAttrs({ source: draft });
  };
  const toggleEditing = () => {
    if (editing) commit();
    setEditing((prev) => !prev);
  };

  return (
    <div
      className="my-4 flex flex-col gap-2 overflow-x-auto rounded-lg border bg-card p-4"
      data-mermaid
      contentEditable={false}
    >
      {editable ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleEditing}
            className="rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      ) : null}
      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          spellCheck={false}
          className="min-h-24 w-full rounded-md border bg-background p-2 font-mono text-sm"
        />
      ) : null}
      {error !== null ? (
        <pre className="text-destructive text-sm whitespace-pre-wrap">
          {error}
          {'\n\n'}
          {attrs.source}
        </pre>
      ) : (
        <div
          ref={containerRef}
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
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
    // while the static export shows the readable source (also mermaid-cli's
    // convention for auto-rendering on the client).
    <pre className="mermaid my-4 overflow-x-auto rounded-lg border bg-card p-4 text-sm">{String(node.attrs?.source ?? '')}</pre>
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
            content: {
              type: 'mermaid',
              attrs: { source: args?.source ?? DEFAULT_SOURCE },
            },
          }),
      },
    },
    slash: [
      {
        id: 'mermaid',
        title: 'Mermaid',
        description: 'Diagram from text',
        group: 'Blocks',
        keywords: ['mermaid', 'diagram', 'flowchart', 'graph'],
        command: 'insertMermaid',
      },
    ],
  });
}
