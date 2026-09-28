'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Eye, Omega, PencilLine, Radical, Sigma, X } from 'lucide-react';
import katex from 'katex';
import { z } from 'zod';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Card, CardContent } from '@/registry/bases/base-ui/ui/card';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import {
  Disclosure,
  DisclosureActions,
  DisclosureContent,
  DisclosureHeader,
  DisclosureTitle,
  DisclosureTrigger,
} from '@/registry/bases/base-ui/components/layout/disclosure';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/registry/bases/base-ui/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { defineFeature, type EditorFeature, type NodeCodec } from '@zeroxsolutions/editor-core/document/core/index';
import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import { CodeMirrorPane } from '../../../shared/code-mirror/index.js';
import { FormulaPreview } from '../../../math/react/preview.js';
import { FormulaViewer } from '../../../math/react/viewer.js';
import { MathPalette } from '../../../math/react/palette.js';

/**
 * Inline + block **math**, rendered with **KaTeX**. The node contract is
 * unchanged: a single `latex` attribute and the `$...$` / `$$...$$` / `data-latex`
 * codecs round-trip exactly as before. What changed is the authoring UI, brought
 * onto the sibling blocks' pattern:
 *
 * - **Block** (`mathBlock`) composes the shared `Disclosure` chrome + `Tabs` -
 *   View shows the rendered formula, Edit shows the design-system `CodeMirrorPane`
 *   (`language="latex"`) with a live preview strip and the symbol/template palette.
 *   `DisclosureContent` is `keepMounted` so collapsing never tears down the render.
 * - **Inline** (`mathInline`) cannot host block chrome in the text flow, so it
 *   stays click-to-edit into a design-system `Popover` holding an `InputGroup`
 *   (input + palette/commit/cancel addons) and a one-line live preview.
 *
 * The heavy render/preview lives in the `math/` surface, reused here so the block
 * and the standalone `MathEditor` share one render path. View/edit and collapse
 * are local view state, never persisted.
 *
 * NOTE - KaTeX stylesheet: KaTeX ships `katex/dist/katex.min.css`. It is
 * **deliberately not** `import`ed here - a JS side-effect CSS import breaks the
 * library's bundling contract. The consuming app includes KaTeX's CSS via the
 * editor's `styles.css` (`@import`); we only emit the KaTeX HTML.
 */
const mathAttrs = z.object({
  latex: z.string().default(''),
});
type MathAttrs = z.infer<typeof mathAttrs>;

/** Wrapper classes shared by the `toReact` codecs so the static export matches the view. */
const MATH_BLOCK_WRAPPER = 'my-4 overflow-x-auto rounded-md bg-muted/40 p-3 text-center';
const MATH_INLINE_WRAPPER = 'inline-block align-middle';

/**
 * The inline popover body: a compact LaTeX input with palette/commit/cancel
 * controls in an `InputGroup` addon and a one-line live preview. Enter commits,
 * Escape cancels. The palette inserts at the input caret (a template lands the
 * caret in its first hole via `caretOffset`).
 */
function MathInlineForm({
  initialLatex,
  onCommit,
  onCancel,
}: {
  initialLatex: string;
  onCommit: (latex: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initialLatex);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  // Sync the caret to the DOM input after a palette insert (an imperative
  // external-system sync - the one legitimate use of an effect here).
  useEffect(() => {
    if (pendingCaret.current === null) return;
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  });

  const insert = (snippet: string, caretOffset?: number) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + snippet + draft.slice(end);
    pendingCaret.current = start + (caretOffset ?? snippet.length);
    setDraft(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCommit(draft);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="LaTeX formula"
          aria-label="Inline LaTeX"
        />
        <InputGroupAddon align="inline-end">
          <MathPalette
            onInsert={insert}
            nativeButton={false}
            trigger={
              <InputGroupButton size="icon-xs" aria-label="Insert symbol">
                <Omega />
              </InputGroupButton>
            }
          />
          <InputGroupButton size="icon-xs" aria-label="Apply" onClick={() => onCommit(draft)}>
            <Check />
          </InputGroupButton>
          <InputGroupButton size="icon-xs" aria-label="Cancel" onClick={onCancel}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FormulaPreview source={draft} displayMode={false} compact />
    </div>
  );
}

/**
 * The inline math node view. Read-only renders the real formula (no edit
 * affordance); editable is click-to-edit into a `Popover` anchored to the formula.
 */
function MathInlineView({ attrs, updateAttrs, editable, selected }: NodeViewProps<MathAttrs>) {
  const [editing, setEditing] = useState(false);

  if (!editable) {
    return (
      <span data-math="inline" className={MATH_INLINE_WRAPPER} contentEditable={false}>
        <FormulaViewer source={attrs.latex} displayMode={false} />
      </span>
    );
  }

  return (
    <Popover open={editing} onOpenChange={setEditing}>
      <PopoverTrigger
        render={<span />}
        nativeButton={false}
        data-math="inline"
        contentEditable={false}
        className={cn(
          'hover:bg-muted inline-block cursor-pointer rounded-sm align-middle',
          selected && 'ring-ring ring-2',
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {attrs.latex ? (
          <FormulaViewer source={attrs.latex} displayMode={false} />
        ) : (
          <span className="text-muted-foreground text-sm italic">empty formula</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <MathInlineForm
          initialLatex={attrs.latex}
          onCommit={(latex) => {
            if (latex !== attrs.latex) updateAttrs({ latex });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * The block math node view. Read-only is a design-system `Card` holding the real
 * formula; editable composes the shared `Disclosure`/`Tabs` chrome.
 */
function MathBlockView({ attrs, updateAttrs, editable, selected }: NodeViewProps<MathAttrs>) {
  if (!editable) {
    return (
      <Card size="sm" className="my-4" data-math="block" contentEditable={false}>
        <CardContent>
          <FormulaViewer source={attrs.latex} />
        </CardContent>
      </Card>
    );
  }

  // A freshly inserted (empty) block opens on Edit; an existing formula opens as a
  // picture. The active tab is uncontrolled view-state - never written to the doc.
  const initialTab = attrs.latex.trim() === '' ? 'edit' : 'view';

  return (
    <Disclosure
      variant="muted"
      data-math="block"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn('my-4', selected && 'ring-ring ring-2')}
    >
      <Tabs defaultValue={initialTab} className="gap-0">
        <DisclosureHeader>
          <DisclosureTitle>
            <Sigma className="shrink-0" />
            <span>Math</span>
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
            <CopyButton value={attrs.latex} label="Copy source" size="icon" />
            <DisclosureTrigger />
          </DisclosureActions>
        </DisclosureHeader>
        {/* keepMounted so collapsing only hides the active panel and never tears
            down an in-flight render. */}
        <DisclosureContent keepMounted>
          <Separator />
          <TabsContent value="view" className="p-2">
            <FormulaPreview source={attrs.latex} />
          </TabsContent>
          <TabsContent value="edit" className="flex flex-col">
            <div className="flex items-center justify-end px-2 pt-2">
              <MathPalette
                onInsert={(snippet) => updateAttrs({ latex: attrs.latex + snippet })}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Omega />
                    Insert
                  </Button>
                }
              />
            </div>
            <CodeMirrorPane
              value={attrs.latex}
              onValueChange={(latex) => updateAttrs({ latex })}
              language="latex"
              placeholder="Write LaTeX source..."
              className="h-48"
            />
            <Separator />
            <div className="p-2">
              <FormulaPreview source={attrs.latex} />
            </div>
          </TabsContent>
        </DisclosureContent>
      </Tabs>
    </Disclosure>
  );
}

/** Escape the characters that matter for text embedded in HTML element content. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/** Escape a value placed inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

const mathInlineCodec: NodeCodec<MathAttrs> = {
  node: 'mathInline',
  // `$...$` is the de-facto inline-math delimiter (TeX / remark-math dialect).
  toMarkdown: (node) => `$${String(node.attrs?.latex ?? '')}$`,
  toHTML: (node) => {
    const latex = String(node.attrs?.latex ?? '');
    // Raw latex rides in `data-latex` so `fromHTML` round-trips it exactly.
    return `<span data-math-inline data-latex="${escapeAttr(latex)}">${escapeHtml(latex)}</span>`;
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
  // Inline `$...$` parsing belongs to the inline layer we don't own, and
  // remark-math isn't installed - HTML is the lossless round-trip path, so
  // decline every Markdown token. (Two-way Markdown would need remark-math.)
  fromMarkdown: () => null,
};

const mathBlockCodec: NodeCodec<MathAttrs> = {
  node: 'mathBlock',
  // `$$ ... $$` fenced on its own lines is the display-math convention.
  toMarkdown: (node) => `$$\n${String(node.attrs?.latex ?? '')}\n$$`,
  toHTML: (node) => {
    const latex = String(node.attrs?.latex ?? '');
    return `<div data-math-block data-latex="${escapeAttr(latex)}">${escapeHtml(latex)}</div>`;
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
  // remark (without remark-math) surfaces `$$...$$` as paragraph text; don't
  // mis-parse it - rely on the HTML round-trip. Two-way Markdown for math would
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
      {
        id: 'math-inline',
        icon: <Radical className="size-4" />,
        title: 'Inline math',
        description: 'Inline formula (KaTeX)',
        group: 'Inline',
        keywords: ['math', 'latex', 'katex', 'inline', 'formula'],
        command: 'insertMathInline',
      },
    ],
  });
}
