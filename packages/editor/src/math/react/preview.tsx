'use client';

import { Sigma } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@zeroxsolutions/ui/components/ui/alert';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@zeroxsolutions/ui/components/ui/empty';
import { cn } from '@zeroxsolutions/ui/lib/utils';
import { useMathRender, type MathRenderState } from './use-math-render.js';

/**
 * `<FormulaRender>` - the rendered formula in a design-system container, plus its
 * non-destructive states. There is NO bespoke surface (unlike the mermaid
 * `DiagramCanvas` pan/zoom viewport): a formula is static, so a plain centered box
 * on design-system tokens suffices. A parse error keeps the last good formula
 * visible and shows a destructive `Alert`; empty source shows an `Empty` state.
 * The KaTeX color rides `state.color` (the theme's `variant.math`), applied to the
 * container since KaTeX glyphs inherit `currentColor`.
 *
 * It is presentational (takes a render `state`); `<FormulaPreview>` wraps it with
 * the shared render hook for self-contained callers (the block, the surface).
 */
export interface FormulaRenderProps {
  state: MathRenderState;
  /** Compact one-line form for the inline popover (no framed box, terse empty). */
  compact?: boolean;
  className?: string;
}

export function FormulaRender({ state, compact = false, className }: FormulaRenderProps) {
  const { html, status, error, color } = state;

  return (
    <div
      data-slot="formula-preview"
      className={cn('flex flex-col gap-2', !compact && 'min-h-32', className)}
    >
      {status === 'empty' ? (
        compact ? (
          <span className="text-sm text-muted-foreground italic">Empty formula</span>
        ) : (
          <Empty className="min-h-32 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sigma />
              </EmptyMedia>
              <EmptyTitle>No formula yet</EmptyTitle>
              <EmptyDescription>Write LaTeX to render a formula.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <div
          className={cn(
            'flex flex-1 items-center justify-center overflow-x-auto',
            !compact && 'p-4',
          )}
          style={{ color }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Invalid formula</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export interface FormulaPreviewProps {
  /** The LaTeX source to render. */
  source: string;
  /** `false` renders inline (used by the compact one-line preview). Default `true`. */
  displayMode?: boolean;
  /** Compact one-line form for the inline popover. */
  compact?: boolean;
  className?: string;
}

/** Self-contained preview: owns the shared render hook. Used by the block and surface. */
export function FormulaPreview({
  source,
  displayMode = true,
  compact = false,
  className,
}: FormulaPreviewProps) {
  const state = useMathRender(source, { displayMode });
  return <FormulaRender state={state} compact={compact} className={className} />;
}
