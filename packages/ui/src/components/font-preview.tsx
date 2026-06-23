import * as React from 'react';

import { cn } from '@/lib/utils';

/** Font extension → CSS `format()` hint. */
const FORMAT_BY_EXTENSION: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
  eot: 'embedded-opentype',
};

function formatOf(src: string): string | undefined {
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return ext ? FORMAT_BY_EXTENSION[ext] : undefined;
}

const DEFAULT_SIZES = [36, 24, 18, 14];

export interface FontPreviewProps extends React.ComponentProps<'div'> {
  /** Font file URL or data URL, loaded via a scoped `@font-face`. */
  src: string;
  /** CSS `format()` hint; derived from the `src` extension when omitted. */
  format?: string;
  /** Specimen sizes, in px (largest first). */
  sizes?: number[];
  /** Specimen text. Defaults to a pangram; pass children to override. */
  children?: React.ReactNode;
}

/**
 * Renders a specimen of a font file at several sizes by injecting a `@font-face`
 * scoped to this instance. The specimen string is `children` (defaults to a
 * pangram); `sizes` controls the size scale. Spacing between rows is the
 * component's own; the consumer places and pads the wrapper.
 */
export function FontPreview({
  src,
  format,
  sizes = DEFAULT_SIZES,
  className,
  children,
  ...props
}: FontPreviewProps) {
  const id = React.useId();
  const family = `chisel-font-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fmt = format ?? formatOf(src);
  const specimen = children ?? 'The quick brown fox jumps over the lazy dog';
  const css = `@font-face { font-family: '${family}'; src: url("${src}")${
    fmt ? ` format("${fmt}")` : ''
  }; font-display: swap; }`;

  return (
    <div
      data-slot="font-preview"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    >
      <style>{css}</style>
      {sizes.map((size) => (
        <div key={size} className="flex items-baseline gap-3">
          <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
            {size}
          </span>
          <span
            className="truncate text-foreground"
            style={{ fontFamily: family, fontSize: size, lineHeight: 1.3 }}
          >
            {specimen}
          </span>
        </div>
      ))}
    </div>
  );
}
