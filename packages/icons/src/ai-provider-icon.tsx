import { memo, type CSSProperties, type FC } from 'react';

import { makeAvatar } from './brands/internal/avatar';
import type { IconProps } from './brands/internal/types';
import {
  resolveAiProviderMark,
  type AiProviderMapping,
} from './ai-provider-config';

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
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_SIZE = 24;

/** Neutral placeholder rendered when a provider key resolves to no mark. */
const DefaultMark: FC<IconProps> = ({ size = '1em', style, ...rest }) => (
  <svg
    fill="currentColor"
    height={size}
    style={{ flex: 'none', lineHeight: 1, ...style }}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <title>AI provider</title>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

/**
 * Render an AI provider's brand logo from a provider key. Resolves the key to a
 * vendored `@zeroxsolutions/icons` mark and renders the requested `type`
 * variant, degrading to the base mark when a variant is absent, and to a
 * neutral placeholder when the key matches nothing. Suitable for
 * `AiProviderCard`'s `icon` slot.
 * @example <AiProviderIcon provider="openai" type="avatar" size={32} />
 */
function AiProviderIconBase({
  provider,
  size = DEFAULT_SIZE,
  type = 'color',
  shape = 'circle',
  extra,
  className,
  style,
}: AiProviderIconProps) {
  const mark = resolveAiProviderMark(provider, extra);

  if (!mark) {
    return <DefaultMark size={size} className={className} style={style} />;
  }

  if (type === 'avatar') {
    const Avatar =
      mark.Avatar ??
      makeAvatar((mark.Mono ?? mark) as FC<IconProps>, {
        background: mark.colorPrimary ?? '#000',
      });
    return <Avatar size={size} shape={shape} className={className} style={style} />;
  }

  if (type === 'combine' && mark.Combine) {
    return <mark.Combine size={size} className={className} style={style} />;
  }

  const Icon =
    type === 'color' ? mark.Color ?? mark.Mono ?? mark : mark.Mono ?? mark;
  return <Icon size={size} className={className} style={style} />;
}

/** Memoized AI provider logo resolver. See {@link AiProviderIconProps}. */
export const AiProviderIcon = memo(AiProviderIconBase);
