'use client';

import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { Maximize, Minus, Plus, RotateCcw, Workflow } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/registry/bases/base-ui/ui/alert';
import { FloatingToolbar } from '@/registry/bases/base-ui/components/layout/floating-toolbar';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { useMermaidRender, type MermaidRenderState } from './use-mermaid-render.js';

/**
 * `<DiagramCanvas>` — the diagram render inside a pan/zoom viewport. This
 * transform viewport is the **only** bespoke surface in the Mermaid editor (the
 * design system ships no canvas/zoom-pan primitive); it is a coordinate-anchored
 * shell that `ui-primitive-fidelity` sanctions. Every control rendered over it
 * (zoom buttons, badge) is a design-system `Button` on tokens, and the
 * error/empty states are the design-system `Alert`/`Empty`. Errors are
 * non-destructive — the last good render stays visible beneath the alert.
 *
 * It is presentational (takes a render `state`); `<DiagramPreview>` wraps it with
 * the shared render hook for self-contained callers (the in-document block).
 */

interface Transform {
  x: number;
  y: number;
  k: number;
}

const IDENTITY: Transform = { x: 0, y: 0, k: 1 };
const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

const clamp = (value: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, value));

export interface DiagramCanvasProps {
  state: MermaidRenderState;
  className?: string;
}

export function DiagramCanvas({ state, className }: DiagramCanvasProps) {
  const { svg, status, error, line } = state;
  const [transform, setTransform] = useState<Transform>(IDENTITY);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const pan = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const current = transformRef.current;
    pan.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: current.x,
      origY: current.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = pan.current;
    if (!active || active.pointerId !== event.pointerId) return;
    setTransform((prev) => ({
      ...prev,
      x: active.origX + (event.clientX - active.startX),
      y: active.origY + (event.clientY - active.startY),
    }));
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pan.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pan.current = null;
  };

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setTransform((prev) => {
      const k = clamp(prev.k * factor, MIN_SCALE, MAX_SCALE);
      const ratio = k / prev.k;
      return {
        k,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      };
    });
  }, []);

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const cx = rect ? event.clientX - rect.left : 0;
    const cy = rect ? event.clientY - rect.top : 0;
    zoomAt(event.deltaY < 0 ? 1.1 : 1 / 1.1, cx, cy);
  };

  const zoomButton = (factor: number) => {
    const viewport = viewportRef.current;
    const cx = viewport ? viewport.clientWidth / 2 : 0;
    const cy = viewport ? viewport.clientHeight / 2 : 0;
    zoomAt(factor, cx, cy);
  };

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    const svgEl = contentRef.current?.querySelector('svg');
    if (!viewport || !svgEl) {
      setTransform(IDENTITY);
      return;
    }
    const rect = svgEl.getBoundingClientRect();
    const currentK = transformRef.current.k || 1;
    const intrinsicW = rect.width / currentK;
    const intrinsicH = rect.height / currentK;
    if (intrinsicW === 0 || intrinsicH === 0) {
      setTransform(IDENTITY);
      return;
    }
    const cw = viewport.clientWidth;
    const ch = viewport.clientHeight;
    const k = clamp(Math.min(cw / intrinsicW, ch / intrinsicH) * 0.95, MIN_SCALE, MAX_SCALE);
    setTransform({
      k,
      x: (cw - intrinsicW * k) / 2,
      y: (ch - intrinsicH * k) / 2,
    });
  }, []);

  const reset = useCallback(() => setTransform(IDENTITY), []);

  return (
    <div
      data-slot="diagram-canvas"
      className={cn('bg-card relative flex h-full min-h-48 flex-col overflow-hidden rounded-md border', className)}
    >
      <div
        ref={viewportRef}
        className="relative flex-1 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={onWheel}
      >
        {status === 'empty' ? (
          <Empty className="absolute inset-0 h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Workflow />
              </EmptyMedia>
              <EmptyTitle>No diagram yet</EmptyTitle>
              <EmptyDescription>Write Mermaid source to render a diagram.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div
            ref={contentRef}
            className="absolute top-0 left-0 origin-top-left will-change-transform"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      {status !== 'empty' && (
        <FloatingToolbar aria-label="Zoom controls" className="absolute right-2 bottom-2">
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => zoomButton(1 / 1.2)}>
            <Minus />
          </Button>
          <span className="text-muted-foreground min-w-10 text-center text-xs tabular-nums">
            {Math.round(transform.k * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => zoomButton(1.2)}>
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Fit to view" onClick={fit}>
            <Maximize />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Reset view" onClick={reset}>
            <RotateCcw />
          </Button>
        </FloatingToolbar>
      )}

      {status === 'error' && (
        <Alert variant="destructive" className="absolute inset-x-2 bottom-2 w-auto">
          <AlertTitle>Diagram error{line ? ` — line ${line}` : ''}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export interface DiagramPreviewProps {
  source: string;
  className?: string;
}

/** Self-contained preview: owns the shared render hook. Used by the block. */
export function DiagramPreview({ source, className }: DiagramPreviewProps) {
  const state = useMermaidRender(source);
  return <DiagramCanvas state={state} className={className} />;
}
