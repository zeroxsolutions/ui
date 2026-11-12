/**
 * The brand marks of `@zeroxsolutions/icons`, drawn from the brand-mark CDN by expo-image: `BrandMark` for a brand
 * by its name, and `AiProviderIcon` for an AI provider by its key.
 */
import { resolveAiProviderMark } from '@zeroxsolutions/icons/ai-provider-mappings';
import {
  brandMarkChain,
  brandMarkRatio,
  brandMarkUrlFor,
  type BrandMarkName,
  type BrandMarkVariant,
} from '@zeroxsolutions/icons/brand-mark-url';
import { Image } from 'expo-image';
import { Sparkle } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { useChartTheme } from './chart-theme';

/** The one-colour variants, whose files the foreground colour tints. */
const TINTED: ReadonlySet<BrandMarkVariant> = new Set(['mono', 'combine']);

/**
 * The URLs `name`'s mark is tried at, in fallback order from `variant`, `combine` and `avatar` to `color` to
 * `mono`, keeping only the variants the package's manifest lists a file for. Empty for a name the manifest lacks.
 * @param base - serve from this base instead of the package's default; a trailing slash is dropped
 */
function brandMarkSources(
  name: BrandMarkName,
  variant: BrandMarkVariant,
  base?: string,
): { variant: BrandMarkVariant; url: string }[] {
  return brandMarkChain(name, variant).map((drawn) => ({ variant: drawn, url: brandMarkUrlFor(name, drawn, base) }));
}

interface BrandMarkProps {
  /** The brand to draw. */
  name: BrandMarkName;
  /** How to draw it; defaults to `'color'`. */
  variant?: BrandMarkVariant;
  /** Height in pixels; defaults to 16. The width follows the file's ratio. */
  size?: number;
  /** The mark's name for a screen reader. Omit it where text beside the mark already names it, which hides the mark. */
  label?: string;
  /** Serve from this base instead of the package's default CDN. */
  base?: string;
  /** The avatar's outline; ignored by every other variant. Defaults to `'circle'`. */
  shape?: 'circle' | 'square';
}

/**
 * A brand's mark, drawn from a file on the brand-mark CDN. A variant the mark has no file for, or one whose file
 * fails to load, falls to the next one along `combine`/`avatar` -> `color` -> `mono`, and past `mono` to the first
 * letter of the name on a tinted circle, so the mark is never blank. `mono` and `combine` are tinted the foreground
 * colour.
 */
function BrandMark({ name, variant = 'color', size = 16, label, base, shape = 'circle' }: BrandMarkProps): ReactNode {
  const { themeColor } = useChartTheme();
  const sources = brandMarkSources(name, variant, base);
  const key = sources.map((source) => source.url).join(' ');
  const [failed, setFailed] = useState({ key, count: 0 });
  // Only the current sources' failures count: a mark handed another name or variant starts again from the top.
  if (failed.key !== key) setFailed({ key, count: 0 });
  const drawn = failed.key === key ? sources[failed.count] : sources[0];
  const named = label ? { accessible: true, role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true };

  if (!drawn) {
    return (
      <View
        className="bg-foreground/10 items-center justify-center rounded-full"
        style={{ width: size, height: size }}
        {...named}
      >
        <Text aria-hidden className="font-sans-semibold" style={{ fontSize: size * 0.6, lineHeight: size }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  const radius = drawn.variant === 'avatar' ? (shape === 'circle' ? size / 2 : size / 4) : 0;
  return (
    <View style={{ width: size * brandMarkRatio(name, drawn.variant), height: size }} {...named}>
      <Image
        source={drawn.url}
        accessible={false}
        contentFit="contain"
        tintColor={TINTED.has(drawn.variant) ? themeColor('--foreground') : undefined}
        style={{ width: '100%', height: '100%', borderRadius: radius }}
        onError={() => setFailed({ key, count: (failed.key === key ? failed.count : 0) + 1 })}
      />
    </View>
  );
}

/** Which form of the provider's mark to draw. */
type AiProviderIconType = 'color' | 'mono' | 'avatar' | 'combine';

interface AiProviderIconProps {
  /** The provider key to resolve, case-insensitively, such as `openai`, `claude-code` or `bfl`. */
  provider: string;
  /** Size in pixels; defaults to 24. */
  size?: number;
  /** Defaults to `'color'`, which falls to `mono` where the mark ships no colour file. */
  type?: AiProviderIconType;
  /** The avatar's outline when `type` is `avatar`; defaults to `'circle'`. */
  shape?: 'circle' | 'square';
  /** The icon's name for a screen reader. Omit it where text beside the icon names the provider, which hides it. */
  label?: string;
}

/**
 * An AI provider's brand mark from its key, through {@link BrandMark}, which falls back along its own chain; a key
 * that resolves to no mark draws a neutral sparkle in the foreground colour.
 */
function AiProviderIcon({ provider, size = 24, type = 'color', shape, label }: AiProviderIconProps): ReactNode {
  const { themeColor } = useChartTheme();
  const mark = resolveAiProviderMark(provider);
  if (mark) return <BrandMark name={mark} variant={type} size={size} shape={shape} label={label} />;
  return (
    <View
      style={{ width: size, height: size }}
      {...(label ? { accessible: true, role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true })}
    >
      <Sparkle size={size} color={themeColor('--foreground')} />
    </View>
  );
}

export { AiProviderIcon, BrandMark, brandMarkSources };
export type { AiProviderIconProps, AiProviderIconType, BrandMarkProps };
