import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cn } from '../registry/lib/utils';
import { emitSource } from './emit';
import { parseSlotMap, type SlotMap } from './slot-map';

type Style = 'vega' | 'nova';

const STYLE_SLOTS: Readonly<Record<Style, SlotMap>> = {
  vega: parseSlotMap(readFileSync(join(__dirname, '../../styles/upstream/style-vega.css'), 'utf8')),
  nova: parseSlotMap(readFileSync(join(__dirname, '../../styles/upstream/style-nova.css'), 'utf8')),
};

/**
 * The classes a rendered `className` holds once the registry build has replaced each `cn-<slot>`
 * token in it for NativeWind in `style` and Tailwind has merged the result, as it does at runtime, so
 * a spec can assert a class the style fixes without the source's tokens.
 */
export function emittedClasses(className: string | undefined, style: Style = 'vega'): string[] {
  const otherStyles = Object.entries(STYLE_SLOTS).flatMap(([name, slots]) => (name === style ? [] : [slots]));
  const emitted = emitSource(`"${className ?? ''}"`, STYLE_SLOTS[style], 'nativewind', 'spec', otherStyles);
  return cn(emitted.slice(1, -1)).split(/\s+/).filter(Boolean);
}
