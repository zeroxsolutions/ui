'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  ALIGNS,
  WIDTH_MIN,
  snapWidth,
  type LayoutAlign,
  type LayoutWidth,
} from '@zeroxsolutions/editor-core/template/layout/index';
import { AlignControl } from '../layout/align-control';
import { BlockToolbar } from '../layout/block-toolbar';
import { layoutProps } from '../layout/layout-props';
import type { LayoutWords } from '../layout/layout-words';
import { ResizeHandles } from '../layout/resize-handles';
import { WidthToggle } from '../layout/width-toggle';

/** Where a block is edited: the editor and the block's position in it, as its node view reads them. */
export interface BlockLayoutPlace {
  readonly editor: IEditor;
  getPos(): number | undefined;
}

export interface BlockLayoutFrameProps {
  /** The block's stored `align` and `width`; a value outside the layout's sets draws as none. */
  readonly align: unknown;
  readonly width: unknown;
  /** Width handles and a Full width toggle beside the alignment; the alignment alone when false. */
  readonly resizable: boolean;
  /**
   * The block is drawn at its own width while it sets none, placed across its line by its alignment, as an image
   * at its own size or a file's row; it takes the whole line when false.
   */
  readonly fit: boolean;
  /** The editable editor the block is in; null in the Viewer and in a read-only editor, which draw no controls. */
  readonly place: BlockLayoutPlace | null;
  readonly words: LayoutWords;
  /**
   * A whole pixel width an email stored before widths were shares, drawn while `width` is none: at its pixels,
   * never wider than its line, as the email draws it. The first drag or key writes a share in its place.
   */
  readonly pixels?: number | null;
  /** The block's own drawing, which fills the frame. */
  readonly children: ReactNode;
}

function alignOf(value: unknown): LayoutAlign | null {
  return (ALIGNS as readonly unknown[]).includes(value) ? (value as LayoutAlign) : null;
}

function widthOf(value: unknown): LayoutWidth | null {
  return value === 'full' || (typeof value === 'number' && value >= WIDTH_MIN && value <= 1) ? value : null;
}

/**
 * The share of its line `frame` is drawn at, snapped as a drag is: what a block at its own width starts a drag
 * from. The line is capped at `--layout-container`, as the handles read it.
 */
function drawnShareOf(frame: HTMLElement): number {
  const line = frame.parentElement?.getBoundingClientRect().width ?? 0;
  const capped = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--layout-container'));
  const base = Number.isFinite(capped) && capped > 0 ? Math.min(capped, line) : line;
  return base > 0 ? snapWidth(frame.getBoundingClientRect().width / base) : 1;
}

/**
 * A block's place across its line and its width, the same in the editor and the Viewer: a frame drawing the
 * block's `align` and `width` as `layoutProps` writes them. In an editable editor it adds the block's floating
 * toolbar, with the alignment and, for a block that takes a width, the Full width toggle where the editor takes
 * a bleed, and a width handle on each side. A drag previews on the frame alone and stores its width once.
 */
function BlockLayoutFrame({
  align,
  width,
  resizable,
  fit,
  place,
  words,
  pixels = null,
  children,
}: BlockLayoutFrameProps): ReactNode {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const placed = alignOf(align);
  const stored = widthOf(width);
  const drawn = preview ?? stored;
  const drawnPixels = drawn === null && typeof pixels === 'number' && pixels >= 1 ? pixels : null;
  const props = layoutProps({ align: placed, width: drawn });
  return (
    <div
      ref={setFrame}
      data-slot="block-layout"
      data-fit={(fit && drawn === null && drawnPixels === null) || undefined}
      {...props}
      {...(drawnPixels === null
        ? {}
        : { style: { ...props.style, '--layout-pixels': `${drawnPixels}px` } as CSSProperties })}
      className="relative"
    >
      {children}
      {place && (
        <BlockLayoutFrameControls
          place={place}
          frame={frame}
          align={placed}
          width={stored}
          resizable={resizable}
          words={words}
          onPreview={setPreview}
        />
      )}
    </div>
  );
}

/** The toolbar and the width handles of a block in an editable editor. */
function BlockLayoutFrameControls({
  place,
  frame,
  align,
  width,
  resizable,
  words,
  onPreview,
}: {
  place: BlockLayoutPlace;
  frame: HTMLDivElement | null;
  align: LayoutAlign | null;
  width: LayoutWidth | null;
  resizable: boolean;
  words: LayoutWords;
  onPreview(width: number | null): void;
}): ReactNode {
  const { editor, getPos } = place;
  const pos = getPos();
  const [ownShare, setOwnShare] = useState(1);
  const set = (layout: Record<string, unknown>): void => {
    editor.run('setBlockLayout', { pos: getPos(), layout });
  };
  // The email draws no bleed, and its editor refuses one.
  const bleeds = resizable && pos !== undefined && editor.can('setBlockLayout', { pos, layout: { width: 'full' } });

  // A block at its own width is dragged from the width it is drawn at, which its content and its line decide.
  useEffect(() => {
    if (!resizable || !frame || width !== null) return;
    const measure = () => setOwnShare(drawnShareOf(frame));
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    if (frame.parentElement) observer.observe(frame.parentElement);
    return () => observer.disconnect();
  }, [resizable, frame, width]);

  return (
    <>
      <BlockToolbar editor={editor} pos={pos} anchor={frame} label={words.toolbar}>
        <AlignControl value={align} onChange={(picked) => set({ align: picked })} words={words} />
        {bleeds && (
          <WidthToggle
            full={width === 'full'}
            onChange={(full) => set({ width: full ? 'full' : null })}
            words={words}
          />
        )}
      </BlockToolbar>
      {resizable && width !== 'full' && (
        <ResizeHandles
          value={width ?? ownShare}
          align={align ?? 'start'}
          words={words}
          onPreview={onPreview}
          onCommit={(committed) => {
            onPreview(null);
            set({ width: committed });
          }}
          onCancel={() => onPreview(null)}
        />
      )}
    </>
  );
}

export { BlockLayoutFrame };
