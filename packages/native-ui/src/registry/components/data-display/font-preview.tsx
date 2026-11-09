import { loadAsync } from 'expo-font';
import { useEffect, useId, useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';
import { Text } from '../../ui/text';

/** The specimen's line height over its font size, the web's `leading-snug`. */
const LEADING_SNUG = 1.375;

/** A short tag of `src`, which tells two files apart in a family name made of letters and digits. */
function tagOf(src: string): string {
  let hash = 0;
  for (const char of src) hash = (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) | 0;
  return (hash >>> 0).toString(36);
}

type FontPreviewProps = ComponentProps<typeof View> & {
  /** Font file URL, loaded through expo-font under a family scoped to this instance. */
  src: string;
  /** Specimen sizes in px, largest first; `[36, 24, 18, 14]` when omitted. */
  sizes?: number[];
  /** Specimen text; a pangram when omitted. */
  children?: ReactNode;
};

/**
 * A specimen of a font file at several sizes, one row per size. The consumer places, pads and widths the
 * wrapper; the root fills that width so each row's specimen truncates with an ellipsis at it. Until the
 * file has loaded, and when it fails to, the specimen is drawn in the theme's font, as the web's
 * `font-display: swap` draws it; iOS refuses a family it has not loaded, so the specimen names the
 * instance's family only once it has.
 */
function FontPreview({
  src,
  sizes = [36, 24, 18, 14],
  className,
  children = 'The quick brown fox jumps over the lazy dog',
  ...props
}: FontPreviewProps): ReactNode {
  const id = useId();
  const family = `font-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  // The family last loaded, and its file; a specimen names it only while `src` is still that file.
  const [loaded, setLoaded] = useState<{ src: string; family: string }>();
  const loadedFamily = loaded?.src === src ? loaded.family : undefined;

  useEffect(() => {
    let mounted = true;
    // expo-font keeps a family once loaded and loads no other file under its name, so each file gets its own.
    const name = `${family}${tagOf(src)}`;
    loadAsync(name, src)
      .then(() => {
        if (mounted) setLoaded({ src, family: name });
      })
      .catch(() => {
        // A file that does not load leaves the specimen in the theme's font, which is all the reader sees of it.
      });
    return () => {
      mounted = false;
    };
  }, [family, src]);

  return (
    <View className={cn('w-full min-w-0 flex-col gap-4', className)} {...props}>
      {sizes.map((size) => (
        <View key={size} className="flex-row items-baseline gap-3">
          <Text className="text-muted-foreground w-10 shrink-0 text-xs tabular-nums">{size}</Text>
          <Text
            numberOfLines={1}
            className="text-foreground min-w-0 flex-1"
            style={{
              fontSize: size,
              lineHeight: size * LEADING_SNUG,
              ...(loadedFamily === undefined ? {} : { fontFamily: loadedFamily }),
            }}
          >
            {children}
          </Text>
        </View>
      ))}
    </View>
  );
}

export { FontPreview };
export type { FontPreviewProps };
