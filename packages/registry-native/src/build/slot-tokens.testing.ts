import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cn } from '../registry/lib/utils';
import { emitSource } from './emit';
import { parseSlotMap } from './slot-map';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-vega.css');

/**
 * The classes a rendered `className` holds once the registry build has replaced each `cn-<slot>`
 * token in it for NativeWind and Tailwind has merged the result, as it does at runtime, so a spec
 * can assert a class Vega fixes without the source's tokens.
 */
export function emittedClasses(className: string | undefined): string[] {
  const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const emitted = emitSource(`"${className ?? ''}"`, slots, 'nativewind', 'spec');
  return cn(emitted.slice(1, -1)).split(/\s+/).filter(Boolean);
}
