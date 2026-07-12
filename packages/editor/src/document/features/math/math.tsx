import { useEffect, useState, type KeyboardEvent } from 'react';
import { Sigma } from 'lucide-react';
import { z } from 'zod';
import katex from 'katex';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeViewProps } from '../../core/index.js';
import { useEditorTheme } from '../../../shared/theme/editor-theme-context.js';

/**
 * Inline + block **math**, rendered with **KaTeX**. Serves as the worked example
 * for a *two-node* leaf feature: two declarative atom `NodeSpec`s (`mathInline`
 * in the inline flow, `mathBlock` in the block flow), a React `render` view that
 * renders the formula **synchronously** with KaTeX (SSR-safe, no lazy load) plus
 * a click-to-edit `latex` affordance, and one two-way `NodeCodec` per node —
 * all engine-free (no `@tiptap/*` / `prosemirror-*` import; `katex` is a pure
 * rendering lib, allowed here).
 *
 * NOTE — KaTeX stylesheet: KaTeX ships `katex/dist/katex.min.css`. It is
 * **deliberately not** `import`ed here — a JS side-effect CSS import breaks the
 * library's Tailwind/bundling contract (see `ui-from-design-system`). The
 * consuming app must include KaTeX's CSS (the editor's `styles.css` documents
 * this) for the rendered markup below to lay out correctly; we only emit the
 * KaTeX HTML.
 */
const mathAttrs = z.object({
  latex: z.string().default(''),
});
type MathAttrs = z.infer<typeof mathAttrs>;

interface MathViewProps extends NodeViewProps<MathAttrs> {
  /** `true` → block/display math (`<div>`, KaTeX `displayMode`); `false` → inline (`<span>`). */
  display: boolean;
}

/**
 * Wrapper classes shared by the editable node view and the static `toReact`
 * codec, so the editor and the engine-free Viewer render an identical shell.
 * Block math is a centered, scrollable muted box; inline math sits in the text
 * flow with no box (design-system tokens, no hardcoded color).
 */
const MATH_BLOCK_WRAPPER = 'my-4 overflow-x-auto rounded-md bg-muted/40 p-3 text-center';
const MATH_INLINE_WRAPPER = 'inline-block align-middle';

function MathView({ attrs, updateAttrs, editable, display }: MathViewProps) {
  // KaTeX's color is the one JS-side theme value that doesn't ride the CSS
  // `.dark` flip, so it comes from the active editor theme's variant.
  const { variant } = useEditorTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(attrs.latex);

  // Keep the draft in sync when the attribute changes from outside the view.
  useEffect(() => {
    setDraft(attrs.latex);
  }, [attrs.latex]);

  const commit = () => {
    setEditing(false);
    if (draft !== attrs.latex) updateAttrs({ latex: draft });
  };
  const beginEditing = () => {
    if (editable) setEditing(true);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      beginEditing();
    }
  };

  // KaTeX renders synchronously to an HTML string — no DOM, no async, SSR-safe.
  const html = attrs.latex
    ? katex.renderToString(attrs.latex, {
        throwOnError: false,
        displayMode: display,
        ...variant.math,
      })
    : '';

  const rendered = html ? (
    display ? (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    ) : (
      <span dangerouslySetInnerHTML={{ __html: html }} />
    )
  ) : (
    <span className="text-muted-foreground text-sm italic">empty formula</span>
  );

  if (editing && editable) {
    return display ? (
      <div className={MATH_BLOCK_WRAPPER} data-math="block" contentEditable={false}>
        <textarea
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          spellCheck={false}
          className="min-h-16 w-full rounded-md border bg-background p-2 font-mono text-sm"
        />
      </div>
    ) : (
      <span className={MATH_INLINE_WRAPPER} data-math="inline" contentEditable={false}>
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          spellCheck={false}
          className="rounded-md border bg-background px-2 py-1 font-mono text-sm"
        />
      </span>
    );
  }

  // When editable, the whole formula is a click/keyboard affordance into edit mode.
  const interactive: {
    role?: 'button';
    tabIndex?: number;
    onClick?: () => void;
    onKeyDown?: (event: KeyboardEvent) => void;
  } = editable
    ? { role: 'button', tabIndex: 0, onClick: beginEditing, onKeyDown }
    : {};

  return display ? (
    <div
      className={MATH_BLOCK_WRAPPER}
      data-math="block"
      contentEditable={false}
      {...interactive}
    >
      {rendered}
    </div>
  ) : (
    <span
      className={MATH_INLINE_WRAPPER}
      data-math="inline"
      contentEditable={false}
      {...interactive}
    >
      {rendered}
    </span>
  );
}

const MathInlineView = (props: NodeViewProps<MathAttrs>) => (
  <MathView {...props} display={false} />
);
const MathBlockView = (props: NodeViewProps<MathAttrs>) => (
  <MathView {...props} display />
);

/** Escape the characters that matter for text embedded in HTML element content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
/** Escape a value placed inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

const mathInlineCodec: NodeCodec<MathAttrs> = {
  node: 'mathInline',
  // `$…$` is the de-facto inline-math delimiter (TeX / remark-math dialect).
  toMarkdown: (node) => `$${String(node.attrs?.latex ?? '')}$`,
  toHTML: (node) => {
    const latex = String(node.attrs?.latex ?? '');
    // Raw latex rides in `data-latex` so `fromHTML` round-trips it exactly.
    return `<span data-math-inline data-latex="${escapeAttr(latex)}">${escapeHtml(
      latex,
    )}</span>`;
  },
  fromHTML: (element) =>
    element.hasAttribute('data-math-inline')
      ? {
          type: 'mathInline',
          attrs: {
            latex: element.getAttribute('data-latex') ?? element.textContent ?? '',
          },
        }
      : null,
  toReact: (node) => {
    const latex = String(node.attrs?.latex ?? '');
    return (
      <span
        data-math-inline
        className={MATH_INLINE_WRAPPER}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(latex, { throwOnError: false }),
        }}
      />
    );
  },
  // Inline `$…$` parsing belongs to the inline layer we don't own, and
  // remark-math isn't installed — HTML is the lossless round-trip path, so
  // decline every Markdown token. (Two-way Markdown would need remark-math.)
  fromMarkdown: () => null,
};

const mathBlockCodec: NodeCodec<MathAttrs> = {
  node: 'mathBlock',
  // `$$ … $$` fenced on its own lines is the display-math convention.
  toMarkdown: (node) => `$$\n${String(node.attrs?.latex ?? '')}\n$$`,
  toHTML: (node) => {
    const latex = String(node.attrs?.latex ?? '');
    return `<div data-math-block data-latex="${escapeAttr(latex)}">${escapeHtml(
      latex,
    )}</div>`;
  },
  fromHTML: (element) =>
    element.hasAttribute('data-math-block')
      ? {
          type: 'mathBlock',
          attrs: {
            latex: element.getAttribute('data-latex') ?? element.textContent ?? '',
          },
        }
      : null,
  toReact: (node) => {
    const latex = String(node.attrs?.latex ?? '');
    return (
      <div
        data-math-block
        className={MATH_BLOCK_WRAPPER}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
          }),
        }}
      />
    );
  },
  // remark (without remark-math) surfaces `$$…$$` as paragraph text; don't
  // mis-parse it — rely on the HTML round-trip. Two-way Markdown for math would
  // need remark-math (out of scope for this feature).
  fromMarkdown: () => null,
};

export function math(): EditorFeature {
  return defineFeature({
    id: 'math',
    nodes: [
      {
        name: 'mathInline',
        group: 'inline',
        atom: true,
        selectable: true,
        attrs: mathAttrs,
        render: MathInlineView,
      },
      {
        name: 'mathBlock',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        attrs: mathAttrs,
        render: MathBlockView,
      },
    ],
    codecs: [mathInlineCodec as NodeCodec, mathBlockCodec as NodeCodec],
    commands: {
      insertMathInline: {
        args: z.object({ latex: z.string().default('') }).optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'mathInline',
              attrs: { latex: args?.latex ?? '' },
            },
          }),
      },
      insertMathBlock: {
        args: z.object({ latex: z.string().default('') }).optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'mathBlock',
              attrs: { latex: args?.latex ?? '' },
            },
          }),
      },
    },
    slash: [
      {
        id: 'math-block',
        icon: <Sigma className="size-4" />,
        title: 'Math block',
        description: 'Display equation (KaTeX)',
        group: 'Blocks',
        keywords: ['math', 'latex', 'katex', 'equation', 'formula'],
        command: 'insertMathBlock',
      },
    ],
  });
}
