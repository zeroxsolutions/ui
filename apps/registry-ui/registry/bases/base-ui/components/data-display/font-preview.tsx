import { useId, type ComponentProps, type ReactNode } from 'react';

import { formatOf } from '@/registry/bases/base-ui/lib/font-format';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * `value` as a double-quoted CSS string. Every character outside the set a URL or a format name uses is
 * written as a CSS hex escape, so no value can close the string, the rule or the `<style>` element.
 */
function cssString(value: string): string {
  return `"${value.replace(/[^\w.~:/?#&=%+,;@!$*'-]/gu, (char) => `\\${char.codePointAt(0)?.toString(16)} `)}"`;
}

interface FontPreviewProps extends ComponentProps<'div'> {
  /** Font file URL or data URL, loaded through an `@font-face` scoped to this instance. */
  src: string;
  /** CSS `format()` hint; derived from the `src` extension when omitted. */
  format?: string;
  /** Specimen sizes in px, largest first; `[36, 24, 18, 14]` when omitted. */
  sizes?: number[];
  /** Specimen text; a pangram when omitted. */
  children?: ReactNode;
}

/**
 * A specimen of a font file at several sizes, one row per size. The consumer
 * places and pads the wrapper.
 */
function FontPreview({
  src,
  format,
  sizes = [36, 24, 18, 14],
  className,
  children = 'The quick brown fox jumps over the lazy dog',
  ...props
}: FontPreviewProps): ReactNode {
  const id = useId();
  const family = `font-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fmt = format ?? formatOf(src);
  const css = `@font-face { font-family: '${family}'; src: url(${cssString(src)})${
    fmt ? ` format(${cssString(fmt)})` : ''
  }; font-display: swap; }`;

  return (
    <div data-slot="font-preview" className={cn('flex flex-col gap-4', className)} {...props}>
      <style>{css}</style>
      {sizes.map((size) => (
        <div key={size} className="flex items-baseline gap-3">
          <span className="text-muted-foreground w-10 shrink-0 text-xs tabular-nums">{size}</span>
          <span
            className="text-foreground min-w-0 truncate leading-snug"
            style={{ fontFamily: family, fontSize: size }}
          >
            {children}
          </span>
        </div>
      ))}
    </div>
  );
}

export { FontPreview };
export type { FontPreviewProps };
