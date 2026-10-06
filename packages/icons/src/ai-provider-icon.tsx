'use client';

import { memo, type CSSProperties, type FC } from 'react';

import { BrandMark } from './brand-mark';
import { resolveAiProviderMark, type AiProviderMapping } from './ai-provider-mappings';

/** Which visual form of the resolved brand mark to render. */
export type AiProviderIconType = 'color' | 'mono' | 'avatar' | 'combine';

export interface AiProviderIconProps {
  /** AI provider key to resolve (e.g. `openai`, `claude-code`, `bfl`). */
  provider: string;
  /** Rendered size in pixels. Defaults to 24. */
  size?: number;
  /** Visual variant. Defaults to `color` (the brand's own colors, falling back
   *  to mono when the mark ships no color variant). */
  type?: AiProviderIconType;
  /** Avatar outline when `type` is `avatar`. Defaults to `circle`. */
  shape?: 'circle' | 'square';
  /** Extra mappings checked before the built-in registry (app-specific keys). */
  extra?: AiProviderMapping[];
  /** Accessible name, passed to `<BrandMark>`; omit it where text beside the icon names the provider. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_SIZE = 24;

/** Neutral placeholder rendered when a provider key resolves to no mark; named as BrandMark is. */
const DefaultMark: FC<{ size?: number; label?: string; className?: string; style?: CSSProperties }> = ({
  size = '1em',
  label,
  style,
  ...rest
}) => (
  <svg
    fill="currentColor"
    height={size}
    style={{ flex: 'none', lineHeight: 1, ...style }}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    {...rest}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

/**
 * Render an AI provider's brand logo from a provider key. Resolves the key to a
 * brand mark name and renders it through `<BrandMark>`, which falls back along
 * its own chain; an unknown key draws a neutral placeholder. Suitable for the
 * brand mark inside an `AiProviderCard`'s `CardTitle`.
 * @example <AiProviderIcon provider="openai" type="avatar" size={32} />
 */
function AiProviderIconBase({
  provider,
  size = DEFAULT_SIZE,
  type = 'color',
  shape = 'circle',
  extra,
  label,
  className,
  style,
}: AiProviderIconProps) {
  const mark = resolveAiProviderMark(provider, extra);

  if (!mark) {
    return <DefaultMark size={size} label={label} className={className} style={style} />;
  }

  return (
    <BrandMark name={mark} variant={type} size={size} shape={shape} label={label} className={className} style={style} />
  );
}

/** Memoized AI provider logo resolver. See {@link AiProviderIconProps}. */
export const AiProviderIcon = memo(AiProviderIconBase);
