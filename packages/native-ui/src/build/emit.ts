import { posix } from 'node:path';
import type { SlotMap } from './slot-map.ts';
import {
  findUnknownState,
  parseSpacingVariables,
  translateClasses,
  type Engine,
  type Part,
  type SpacingVariables,
  type StateKey,
} from './translate.ts';

/** A single-line quoted string; the sources write every class list as one. */
const QUOTED_STRING = /(['"])([^'"\n]*)\1/g;
const SLOT_TOKEN = /(?<![\w-])(cn-[\w-]+)(?:\/(text|icon))?(?:@([\w=.+-]+))?(?![\w/@-])/g;
const LEFTOVER_TOKEN = /(?<![\w-])cn-[\w-]+/;
const LINE_COMMENT = /^\s*\/\//;
const RELATIVE_IMPORT = /(from\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;

/** The consumer's alias for each folder of `src/registry`, as shadcn rewrites it on `add`. */
const FOLDER_ALIASES: ReadonlyMap<string, string> = new Map([
  ['ui', '@/components/ui'],
  ['lib', '@/lib'],
]);

/** Removes each run of `//` lines that mentions a slot token, since the emitted file has none left. */
function dropTokenComments(source: string): string {
  const kept: string[] = [];
  let run: string[] = [];
  const closeRun = (): void => {
    if (!run.some((line) => line.includes('cn-'))) kept.push(...run);
    run = [];
  };
  for (const line of source.split('\n')) {
    if (LINE_COMMENT.test(line)) {
      run.push(line);
      continue;
    }
    closeRun();
    kept.push(line);
  }
  closeRun();
  return kept.join('\n');
}

/**
 * One upstream style a registry is emitted in.
 * @property name - the style's name, such as `vega`, which build errors name with the engine
 * @property slots - the slots its style sheet declares
 */
export interface UpstreamStyle {
  name: string;
  slots: SlotMap;
}

/** A style's slots with the spacing variables they define, and the theme's `--radius`. */
interface StyleSlots {
  slots: SlotMap;
  spacingVariables: SpacingVariables;
  radius: string | undefined;
}

function styleSlots(slots: SlotMap, radius: string | undefined): StyleSlots {
  return { slots, spacingVariables: parseSpacingVariables(slots), radius };
}

function slotClasses(
  slot: string,
  part: Part,
  state: StateKey | undefined,
  style: StyleSlots,
  otherStyles: readonly StyleSlots[],
  engine: Engine,
  styleName: string,
  file: string,
): string {
  const registry = `${engine}-${styleName}`;
  const classes = style.slots.get(slot);
  if (!classes) {
    // Upstream's components name every style's slots, and a style that declares no rule for one draws nothing.
    if (otherStyles.some((other) => other.slots.has(slot))) return '';
    throw new Error(`Unknown slot ${slot} in ${file} (${registry})`);
  }
  const unknownState = state === undefined ? undefined : findUnknownState(state);
  if (unknownState !== undefined) {
    throw new Error(`Unknown state ${unknownState} for ${slot} in ${file} (${registry})`);
  }
  const translation = translateClasses(classes, engine, part, state, {
    name: slot,
    spacingVariables: style.spacingVariables,
    radius: style.radius,
  });
  if (translation.unknown.length > 0) {
    throw new Error(`Untranslated ${translation.unknown[0]} in ${slot} (${registry})`);
  }
  const drawnElsewhere = (): boolean =>
    otherStyles.some(
      (other) =>
        translateClasses(other.slots.get(slot) ?? [], engine, part, state, {
          name: slot,
          spacingVariables: other.spacingVariables,
          radius: other.radius,
        }).classes.length > 0,
    );
  if (state !== undefined && translation.classes.length === 0 && !drawnElsewhere()) {
    throw new Error(`Empty state ${state} for ${slot} in ${file} (${registry})`);
  }
  return translation.classes.join(' ');
}

/**
 * Writes one registry source for `engine` in the `upstream` style: every `cn-<slot>`
 * token inside a quoted string becomes that slot's view classes, or nothing when only one of
 * `otherStyles` declares the slot, every `cn-<slot>/text` token its
 * text classes and every `cn-<slot>/icon` token the classes it gives an icon with no size of its
 * own, and a token whose
 * translation is empty is removed. A token ending `@<state>`, such as `cn-switch@checked` or
 * `cn-switch-thumb@size=sm+checked`, becomes only the classes the style puts behind that state, for
 * the component to apply while the state holds, and nothing when the style puts none there but one of
 * `otherStyles` does. The `//` comments that describe the tokens are dropped.
 * A string holding a token has its whitespace collapsed; every other string is left as written.
 * @param file - the source's name, used only in error messages
 * @param otherStyles - the slots of the registry's other styles, which only decide whether an empty
 * state, or a slot this style lacks, is a style's own choice or a typo
 * @param radius - the theme's `--radius`, such as `0.625rem`, which a slot's radius less a length is
 * computed from; with none, such a radius is untranslated
 * @throws {Error} `Unknown slot <slot> in <file> (<engine>-<style>)` for a slot no style declares,
 * `Unknown state <part> for <slot> in <file> (<engine>-<style>)` for a state outside the state vocabulary,
 * `Untranslated <class> in <slot> (<engine>-<style>)` for a slot class with no rule,
 * `Empty state <state> for <slot> in <file> (<engine>-<style>)` for a state token no style puts a class of
 * that part behind, and `Unreplaced <token> in <file>` for a token left outside a quoted string.
 */
export function emitSource(
  source: string,
  upstream: UpstreamStyle,
  engine: Engine,
  file: string,
  otherStyles: readonly SlotMap[] = [],
  radius?: string,
): string {
  const style = styleSlots(upstream.slots, radius);
  const others = otherStyles.map((other) => styleSlots(other, radius));
  const emitted = dropTokenComments(source).replace(QUOTED_STRING, (literal, quote: string, content: string) => {
    if (!content.includes('cn-')) return literal;
    const classes = content.replace(
      SLOT_TOKEN,
      (_token, slot: string, part: 'text' | 'icon' | undefined, state: StateKey | undefined) =>
        slotClasses(slot, part ?? 'view', state, style, others, engine, upstream.name, file),
    );
    return `${quote}${classes.split(/\s+/).filter(Boolean).join(' ')}${quote}`;
  });

  const leftover = LEFTOVER_TOKEN.exec(emitted);
  if (leftover) {
    throw new Error(`Unreplaced ${leftover[0]} in ${file}`);
  }
  return emitted;
}

/**
 * Rewrites the relative imports of a registry source to the aliases shadcn maps onto the
 * consumer's `components.json`, such as `../lib/utils` to `@/lib/utils`.
 * @param file - the source's path under `src/registry`, such as `ui/button.tsx`
 * @throws {Error} `No alias for <specifier> in <file>` for an import outside `ui` and `lib`
 */
export function aliasImports(source: string, file: string): string {
  return source.replace(RELATIVE_IMPORT, (_import, from: string, quote: string, specifier: string) => {
    const [folder, ...rest] = posix.join(posix.dirname(file), specifier).split('/');
    const alias = FOLDER_ALIASES.get(folder);
    if (!alias || rest.length === 0) {
      throw new Error(`No alias for ${specifier} in ${file}`);
    }
    return `${from}${quote}${[alias, ...rest].join('/')}${quote}`;
  });
}
