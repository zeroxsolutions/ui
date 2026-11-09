import { readFileSync } from 'node:fs';
import { cn } from '../registry/lib/utils';
import { emitSource } from './emit';
import { parseSlotMap, type SlotMap } from './slot-map';
import { styleSheetIds } from './style-sheet';
import { themeRadius, type UpstreamColors } from './theme';

const STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const;

type Style = (typeof STYLES)[number];

const STYLE_SLOTS = Object.fromEntries(
  STYLES.map((style) => [
    style,
    parseSlotMap(
      styleSheetIds(style)
        .map((id) => readFileSync(require.resolve(id), 'utf8'))
        .join('\n'),
    ),
  ]),
) as Readonly<Record<Style, SlotMap>>;

const RADIUS = themeRadius(
  JSON.parse(
    readFileSync(require.resolve('@zeroxsolutions/shadcn-upstream/snapshot/colors-neutral.json'), 'utf8'),
  ) as UpstreamColors,
  'nativewind',
);

/**
 * The classes a rendered `className` holds once the registry build has replaced each `cn-<slot>`
 * token in it for NativeWind in `style` and Tailwind has merged the result, as it does at runtime, so
 * a spec can assert a class the style fixes without the source's tokens.
 */
export function emittedClasses(className: string | undefined, style: Style = 'vega'): string[] {
  const otherStyles = Object.entries(STYLE_SLOTS).flatMap(([name, slots]) => (name === style ? [] : [slots]));
  const emitted = emitSource(
    `"${className ?? ''}"`,
    { name: style, slots: STYLE_SLOTS[style] },
    'nativewind',
    'spec',
    otherStyles,
    RADIUS,
  );
  return cn(emitted.slice(1, -1)).split(/\s+/).filter(Boolean);
}
