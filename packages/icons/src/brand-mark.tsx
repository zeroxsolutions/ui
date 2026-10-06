'use client';

import * as React from 'react';
import type { CSSProperties } from 'react';

import type { BrandMarkName } from './lib/brand-manifest';
import {
  brandMarkChain,
  brandMarkRatio,
  brandMarkUrlFor,
  getBrandMarkStyle,
  type BrandMarkVariant,
} from './lib/brand-mark-url';
import { useAmbientBrandMarkStyle } from './lib/brand-mark-style-provider';

export type { BrandMarkName } from './lib/brand-manifest';
export {
  brandMarkUrl,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
  type BrandMarkVariant,
} from './lib/brand-mark-url';
export {
  BrandMarkStyleProvider,
  useBrandMarkStyle,
  type BrandMarkStyleProviderProps,
} from './lib/brand-mark-style-provider';

export interface BrandMarkProps {
  /** The brand to draw. */
  name: BrandMarkName;
  /** How to draw it; the ambient style from a provider, or `'color'`, when omitted. */
  variant?: BrandMarkVariant;
  /** Height, as pixels or a CSS length; `'1em'` when omitted. The width follows the file's ratio. */
  size?: number | string;
  /** Accessible name. Omit it where text beside the mark already names it. */
  label?: string;
  /** Serve from this base instead of the module's. */
  base?: string;
  /** The avatar's outline; ignored by every other variant. */
  shape?: 'circle' | 'square';
  className?: string;
  style?: CSSProperties;
}

const MASKED: ReadonlySet<BrandMarkVariant> = new Set(['mono', 'combine']);

const length = (size: number | string) => (typeof size === 'number' ? `${size}px` : size);
const widthOf = (size: number | string, ratio: number) =>
  typeof size === 'number' ? `${size * ratio}px` : ratio === 1 ? size : `calc(${size} * ${ratio})`;

/**
 * A brand's mark, drawn from a file on the brand-mark CDN. A variant the mark has no file for, or one
 * whose file fails to load, falls to the next one along `combine`/`avatar` -> `color` -> `mono`, and
 * past `mono` to the first letter of the name, so the mark is never blank.
 */
export function BrandMark({
  name,
  variant,
  size = '1em',
  label,
  base,
  shape = 'circle',
  className,
  style,
}: BrandMarkProps) {
  const ambient = useAmbientBrandMarkStyle();
  const chain = brandMarkChain(name, variant ?? ambient ?? getBrandMarkStyle());
  const key = `${name}|${chain.join(',')}|${base ?? ''}`;
  const [failed, setFailed] = React.useState<{ key: string; count: number }>({ key, count: 0 });
  // Only the current key's failures count: a key that returns starts again from the top.
  if (failed.key !== key) setFailed({ key, count: 0 });
  const count = failed.key === key ? failed.count : 0;
  const drawn = chain[count];
  const fail = React.useCallback(() => setFailed({ key, count: count + 1 }), [key, count]);

  const probe = React.useRef<HTMLImageElement>(null);
  React.useEffect(() => {
    const img = probe.current;
    // An image that failed before hydration fired its error before this handler existed.
    if (img && img.complete && img.naturalWidth === 0) fail();
  }, [drawn, fail]);

  const named = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  if (!drawn) {
    return (
      <span
        data-slot="brand-mark"
        data-variant="letter"
        className={className}
        style={{
          alignItems: 'center',
          backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
          borderRadius: '50%',
          display: 'inline-flex',
          flex: 'none',
          fontSize: `calc(${length(size)} * 0.6)`,
          fontWeight: 600,
          height: length(size),
          justifyContent: 'center',
          width: length(size),
          ...style,
        }}
        {...named}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  const src = brandMarkUrlFor(name, drawn, base);
  const box = { flex: 'none', height: length(size), width: widthOf(size, brandMarkRatio(name, drawn)) };

  if (MASKED.has(drawn)) {
    return (
      <span
        data-slot="brand-mark"
        data-variant={drawn}
        className={className}
        style={{
          ...box,
          backgroundColor: 'currentColor',
          display: 'inline-block',
          maskImage: `url("${src}")`,
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          maskSize: 'contain',
          WebkitMaskImage: `url("${src}")`,
          WebkitMaskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          ...style,
        }}
        {...named}
      >
        {/* A mask has no load or error event; this probe of the same URL reports a failure. A mask is
            fetched in CORS mode, so the probe is too: it fails exactly when the mask would. */}
        <img
          ref={probe}
          data-testid="brand-mark-probe"
          src={src}
          crossOrigin="anonymous"
          alt=""
          hidden
          onError={fail}
        />
      </span>
    );
  }

  return (
    <img
      ref={probe}
      data-slot="brand-mark"
      data-variant={drawn}
      src={src}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      decoding="async"
      draggable={false}
      className={className}
      style={{ ...box, borderRadius: drawn === 'avatar' ? (shape === 'circle' ? '50%' : '25%') : undefined, ...style }}
      onError={fail}
    />
  );
}
