import type { SlotMap } from './slot-map';

export type Engine = 'nativewind' | 'uniwind';
export type Part = 'view' | 'text' | 'icon';

export interface Translation {
  classes: string[];
  unknown: string[];
}

/**
 * The state a component applies a state token under: a word from one vocabulary for every component,
 * or a variant of the part or of its group, `<prop>=<value>`. A compound state joins its parts with
 * `+` in sorted order, as {@link stateKeyOf} writes it.
 */
export type StateKey = string;

/** Modifiers React Native has a state for on a `Pressable`, under both engines. */
const KEPT_MODIFIERS: ReadonlySet<string> = new Set(['active', 'disabled', 'dark']);

/**
 * Modifiers whose condition always holds on React Native, so they are removed and the class kept:
 * a `Pressable` takes no `aria-haspopup`.
 */
const HOLDING_MODIFIERS: ReadonlySet<string> = new Set(['not-aria-[haspopup]']);

/**
 * Upstream's selector for an svg inside the slot that names no size of its own. A class behind it goes to
 * the icon part with the selector removed, and Icon applies it only when it names no size itself.
 */
const ICON_MODIFIERS: ReadonlySet<string> = new Set(["[&_svg:not([class*='size-'])]"]);

/**
 * No touch screen produces these conditions, or nothing on a device matches the selector, so the
 * class is dropped with its modifier. A phone is narrower than `md`, so the base class a style widens
 * at `md` stands. The styles put only exit animations behind `data-closed`, which neither engine runs from
 * these utilities.
 */
const DROPPED_MODIFIERS = [
  /^hover$/,
  /^focus-within$/,
  /^md$/,
  /^print$/,
  /^file$/,
  /^after$/,
  /^data-closed$/,
  /^has-data-\[icon=inline-(start|end)\]$/,
  /^(group-)?(not-)?has-\[/,
  /^in-data-\[slot=/,
  /^\*{1,2}$/,
  /^\[&/,
  /^\[\./,
  /^supports-/,
] as const satisfies readonly RegExp[];

/**
 * Each modifier a style puts a state behind, and the state it is. A `group-`, `peer-` or `has-` modifier,
 * its `/<group>` name removed, is the same state on the part's group, sibling or child, which the
 * component knows as its own. A bare `disabled:` stays the `Pressable`'s own and never reaches this
 * table; only its `group-`, `peer-` and `has-` forms do.
 */
const STATE_MODIFIERS: ReadonlyMap<string, StateKey> = new Map(
  Object.entries({
    'data-checked': 'checked',
    'aria-checked': 'checked',
    'data-unchecked': 'unchecked',
    'not-data-checked': 'unchecked',
    'not-data-selected': 'unselected',
    'aria-pressed': 'pressed',
    'data-pressed': 'pressed',
    'data-[state=on]': 'pressed',
    'data-active': 'selected',
    'data-selected': 'selected',
    'data-[active=true]': 'selected',
    'aria-invalid': 'invalid',
    'data-invalid': 'invalid',
    'data-[invalid=true]': 'invalid',
    disabled: 'disabled',
    'data-disabled': 'disabled',
    'data-[disabled=true]': 'disabled',
    'focus-visible': 'focused',
    'data-focus-visible': 'focused',
    'aria-expanded': 'expanded',
    'data-open': 'open',
    'data-horizontal': 'orientation=horizontal',
    'data-vertical': 'orientation=vertical',
    first: 'position=first',
    last: 'position=last',
  }),
);

/** `data-[size=sm]` is the variant state `size=sm`. */
const VARIANT_MODIFIER = /^data-\[([\w-]+)=([\w.-]+)\]$/;
const VARIANT_STATE = /^[\w-]+=[\w.-]+$/;
const RELATIVE_PREFIX = /^(group|peer)-/;
const GROUP_NAME = /\/[\w-]+$/;
const CHILD_PREFIX = /^has-/;

const STATE_WORDS: ReadonlySet<string> = new Set(STATE_MODIFIERS.values());

/**
 * The enter animations a style puts behind `data-open`, which neither engine runs from these utilities;
 * the colours it puts there stay, in the `open` state.
 */
const OPEN_ANIMATION_UTILITY = /^(animate|fade|zoom|slide|spin)-/;

/**
 * A translate by a percentage less a length. On the web the percentage is of the part's own size;
 * css-interop's calc gives up on a percentage mixed with a length, and Uniwind's refuses one.
 */
const OWN_SIZE_TRANSLATE = /^translate-([xy])-\[calc\(100%-([\d.]+)px\)\]$/;
const SIZE_UTILITY = /^(size|w|h)-(?:([\d.]+)|\[([\d.]+)px\])$/;

/**
 * Each spacing variable a style defines on one slot and reads in the slots inside it, such as Card's
 * `--card-spacing`, to the spacing step it holds with no state and in each state that changes it.
 * Tailwind 3 compiles neither `[--name:--spacing(N)]` nor `<utility>-(--name)`, so a read becomes
 * these steps.
 */
export type SpacingVariables = ReadonlyMap<string, Readonly<Record<StateKey, number>>>;

const SPACING_DEFINITION = /^\[(--[\w-]+):--spacing\(([\d.]+)\)\]$/;
const SPACING_READ = /^([a-z]+(?:-[a-z]+)*)-\((--[\w-]+)\)$/;

/**
 * A style draws the hairline edge of a card or popup as `ring-1 ring-<colour>`, a box-shadow a device
 * has no counterpart of, so an unmodified one becomes the border it looks like. Only a slot with no
 * border of its own is given one, and a ring behind a state, `ring-0` and any other width stay dropped.
 */
const RING_WIDTH_UTILITY = 'ring-1';
const RING_COLOUR = /^ring-(?!\d|inset|offset)([\w-]+(?:\/[\w.]+)?)$/;
const BORDER_WIDTH = /^border(-[xytrblse])?(-(\d+|\[[\d.]+px\]))?$/;

/**
 * Classes of one named slot that a device draws another way, unmodified as the styles write them. Upstream
 * centres the radio dot with an absolute 50% offset and a -50% translate; the indicator around it
 * already centres its child with flex, which both engines draw alike, where a percentage translate
 * is the engine's to resolve. The radio group's grid is a display neither engine draws, and a View
 * stacks its items in a column already.
 */
const SLOT_DROPPED_CLASSES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['cn-radio-group', new Set(['grid'])],
  [
    'cn-radio-group-indicator-icon',
    new Set(['absolute', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2']),
  ],
]);

/** The px of one step of the spacing scale, 0.25rem at the 16px rem the theme's setup sets. */
const SPACING_STEP_PX = 4;

/** Utilities with nothing to draw on a device. */
const DROPPED_UTILITIES = [
  /^(outline|ring|ring-offset|transition|duration|ease|whitespace|cursor|scroll)(-|$)/,
  /^select-none$/,
  /^bg-clip-padding$/,
  /^group\//,
] as const satisfies readonly RegExp[];

/**
 * A radius `min(var(--radius-md), Npx)`, which neither engine evaluates. The theme's `--radius-md` is
 * 0.8 of a 0.625rem `--radius`, 8px, so a clamp at 8px or more is `rounded-md`, a size's own radius
 * over the base slot's, such as Nova's `rounded-lg` Button. A consumer who raises `--radius` past the
 * clamp gets `--radius-md` where the web draws the clamp.
 */
const CLAMPED_RADIUS = /^rounded(-[a-z]+)?-\[min\(var\(--radius-md\),([\d.]+)px\)\]$/;
const RADIUS_MD_PX = 8;

/**
 * A `Pressable` ignores `text-*`, so these go to the label through
 * `TextClassContext`; the cascade that does it on the web does not exist.
 */
const TYPOGRAPHY_UTILITY =
  /^(text-|font-|tracking-|leading-|italic$|underline$|underline-offset-|line-through$|uppercase$|lowercase$|capitalize$)/;

/**
 * The theme item maps each Geist weight to its own font family, because Android picks a custom
 * font's weight by family. A weight utility is renamed to that family's class, on both engines.
 */
const GEIST_FAMILY_UTILITIES = {
  'font-normal': 'font-sans',
  'font-medium': 'font-sans-medium',
  'font-semibold': 'font-sans-semibold',
  'font-bold': 'font-sans-bold',
} as const satisfies Readonly<Record<string, string>>;

/**
 * NativeWind 4 runs on Tailwind 3, whose scale steps are one below Tailwind 4's. A Tailwind 4 step
 * past the end of Tailwind 3's scale takes its value as an arbitrary one. The theme item sets the
 * radius steps from `sm` to `4xl` to upstream's own on both engines, so only `rounded-xs`, which it
 * leaves at Tailwind 4's 0.125rem and Tailwind 3 lacks, is renamed.
 */
const RENAMED_UTILITIES = {
  nativewind: {
    ...GEIST_FAMILY_UTILITIES,
    'shadow-xs': 'shadow-sm',
    'shadow-sm': 'shadow',
    'rounded-xs': 'rounded-[0.125rem]',
    'blur-xs': 'blur-sm',
    'drop-shadow-xs': 'drop-shadow-sm',
  },
  uniwind: GEIST_FAMILY_UTILITIES,
} as const satisfies Record<Engine, Readonly<Record<string, string>>>;

/** Weights the theme has no Geist family for, so a font cannot draw them. */
const UNLOADED_WEIGHTS = [/^font-(thin|extralight|light|extrabold|black)$/] as const satisfies readonly RegExp[];

/**
 * Tailwind 4 utilities the engine's Tailwind has no exact equal of, reported rather than renamed to
 * a near one. The `!` suffix is Tailwind 4's spelling of important; neither engine's native styles
 * have an important to give it. Neither engine computes a calc that mixes a percentage with a length,
 * nor a radius clamped below `rounded-md`.
 */
const UNTRANSLATABLE_UTILITIES = {
  nativewind: [
    ...UNLOADED_WEIGHTS,
    /!$/,
    /\[calc\([^\]]*%/,
    /^shadow-2xs$/,
    /^inset-shadow-/,
    /^inset-ring-/,
    /^bg-linear-/,
    /^field-sizing-/,
    /^text-shadow-/,
    CLAMPED_RADIUS,
  ],
  uniwind: [...UNLOADED_WEIGHTS, /!$/, /\[calc\([^\]]*%/, CLAMPED_RADIUS],
} as const satisfies Record<Engine, readonly RegExp[]>;

function partOf(utility: string, onIcon: boolean): Part {
  if (onIcon) return 'icon';
  return TYPOGRAPHY_UTILITY.test(utility) ? 'text' : 'view';
}

/** Splits on `:` outside brackets, so `[&_svg:not(x)]:size-4` keeps its selector whole. */
function splitVariants(cls: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < cls.length; i += 1) {
    const char = cls[i];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) {
      parts.push(cls.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(cls.slice(start));
  return parts;
}

/** Writes a state's parts in the one order a {@link StateKey} has; no parts is the base, `''`. */
export function stateKeyOf(parts: Iterable<string>): StateKey {
  return [...new Set(parts)].sort().join('+');
}

/**
 * Finds the part of `state` that is neither a word of the state vocabulary nor a `<prop>=<value>`
 * variant, so a misspelt state is caught before it translates to nothing.
 * @returns the first such part, or `undefined` when every part is a state
 */
export function findUnknownState(state: StateKey): string | undefined {
  return state.split('+').find((part) => !STATE_WORDS.has(part) && !VARIANT_STATE.test(part));
}

function stateOf(modifier: string): StateKey | undefined {
  const own = modifier.replace(RELATIVE_PREFIX, '').replace(GROUP_NAME, '').replace(CHILD_PREFIX, '');
  for (const candidate of new Set([modifier, own])) {
    const state = STATE_MODIFIERS.get(candidate);
    if (state) return state;
    const variant = VARIANT_MODIFIER.exec(candidate);
    if (variant) return `${variant[1]}=${variant[2]}`;
  }
  return undefined;
}

/** One class of a slot with its modifiers read; a dropped or unknown modifier stops the reading. */
type SlotClass =
  | { reading: 'dropped' }
  | { reading: 'unknown'; source: string }
  | { reading: 'read'; source: string; utility: string; kept: string[]; states: string[]; onIcon: boolean };

function readClass(cls: string): SlotClass {
  const variants = splitVariants(cls);
  const utility = variants.pop() ?? '';
  const modifiers = variants.filter((m) => !HOLDING_MODIFIERS.has(m) && !ICON_MODIFIERS.has(m));
  if (modifiers.some((m) => DROPPED_MODIFIERS.some((rule) => rule.test(m)))) return { reading: 'dropped' };

  const kept: string[] = [];
  const states: string[] = [];
  for (const modifier of modifiers) {
    if (KEPT_MODIFIERS.has(modifier)) {
      kept.push(modifier);
      continue;
    }
    const state = stateOf(modifier);
    if (!state) return { reading: 'unknown', source: cls };
    states.push(state);
  }
  if (states.includes('open') && OPEN_ANIMATION_UTILITY.test(utility)) return { reading: 'dropped' };
  return { reading: 'read', source: cls, utility, kept, states, onIcon: variants.some((m) => ICON_MODIFIERS.has(m)) };
}

/**
 * Reads every `[--name:--spacing(N)]` definition of a style's slots, under the state its modifiers
 * put it behind, such as Card's `--card-spacing` at 6 and at 4 under `size=sm`.
 * @throws {Error} `<name> is defined as both <N> and <M> under state '<state>'` when two definitions
 * of one variable in one state disagree
 */
export function parseSpacingVariables(slots: SlotMap): SpacingVariables {
  const variables = new Map<string, Record<StateKey, number>>();
  for (const classes of slots.values()) {
    for (const cls of classes.map(readClass)) {
      const definition = cls.reading === 'read' ? SPACING_DEFINITION.exec(cls.utility) : null;
      if (cls.reading !== 'read' || !definition) continue;
      const [, variable, step] = definition;
      const state = stateKeyOf(cls.states);
      const steps = variables.get(variable) ?? {};
      const defined = steps[state];
      if (defined !== undefined && defined !== Number(step)) {
        throw new Error(`${variable} is defined as both ${defined} and ${step} under state '${state}'`);
      }
      steps[state] = Number(step);
      variables.set(variable, steps);
    }
  }
  return variables;
}

/**
 * Replaces a definition of a spacing variable with nothing and a read of one with the classes of its
 * steps, each behind the state that sets it. A variable `spacingVariables` has no entry for is left
 * unknown.
 */
function resolveSpacingVariables(cls: SlotClass, spacingVariables: SpacingVariables): SlotClass[] {
  if (cls.reading !== 'read') return [cls];
  const definition = SPACING_DEFINITION.exec(cls.utility);
  const read = SPACING_READ.exec(cls.utility);
  const variable = definition?.[1] ?? read?.[2];
  if (variable === undefined) return [cls];
  const steps = spacingVariables.get(variable);
  if (!steps) return [{ reading: 'unknown', source: cls.source }];
  if (!read) return [];
  return Object.entries(steps).map(([state, step]) => ({
    ...cls,
    utility: `${read[1]}-${step}`,
    states: state === '' ? cls.states : [...cls.states, state],
  }));
}

/** Whether the slot draws a ring edge and has no border to draw it as already. */
function drawsRingAsBorder(slot: readonly SlotClass[]): boolean {
  const unmodified = slot.flatMap((cls) =>
    cls.reading === 'read' && cls.states.length === 0 && cls.kept.length === 0 ? [cls.utility] : [],
  );
  return unmodified.includes(RING_WIDTH_UTILITY) && !unmodified.some((utility) => BORDER_WIDTH.test(utility));
}

/** The border an unmodified ring becomes, or the utility itself when it is not one. */
function ringAsBorder(utility: string): string {
  if (utility === RING_WIDTH_UTILITY) return 'border';
  const colour = RING_COLOUR.exec(utility)?.[1];
  return colour === undefined ? utility : `border-${colour}`;
}

/**
 * Resolves a translate by the part's own size less a length to px, from the size the slot gives the
 * part in the class's own state or the nearest state it holds. Left as it is when the slot names no
 * single such size, so the calc is reported.
 */
function resolveOwnSizeTranslate(utility: string, states: readonly string[], slot: readonly SlotClass[]): string {
  const translate = OWN_SIZE_TRANSLATE.exec(utility);
  if (!translate) return utility;
  const [, axis, less] = translate;
  const sizes = slot.flatMap((cls) => {
    if (cls.reading !== 'read' || cls.kept.length > 0 || !cls.states.every((s) => states.includes(s))) return [];
    const size = SIZE_UTILITY.exec(cls.utility);
    if (!size || size[1] === (axis === 'x' ? 'h' : 'w')) return [];
    const px = size[2] === undefined ? Number(size[3]) : Number(size[2]) * SPACING_STEP_PX;
    return [{ px, specificity: cls.states.length }];
  });
  const nearest = Math.max(...sizes.map((size) => size.specificity));
  const values = new Set(sizes.filter((size) => size.specificity === nearest).map((size) => size.px));
  if (values.size !== 1) return utility;
  const [px] = values;
  return `translate-${axis}-[${px - Number(less)}px]`;
}

/** The theme's `rounded-md` for a radius clamped at no less than it, or the utility itself. */
function resolveClampedRadius(utility: string): string {
  const clamp = CLAMPED_RADIUS.exec(utility);
  if (!clamp || Number(clamp[2]) < RADIUS_MD_PX) return utility;
  return `rounded${clamp[1] ?? ''}-md`;
}

/** What the translation of one slot reads besides its classes. */
export interface SlotContext {
  /**
   * The slot's name, such as `cn-radio-group`, which drops the classes {@link SLOT_DROPPED_CLASSES}
   * lists for it; with none, no class is dropped by name.
   */
  name?: string;
  /**
   * The spacing variables of the slot's style, from {@link parseSpacingVariables}; with none, every
   * definition and read of a spacing variable is unknown.
   */
  spacingVariables?: SpacingVariables;
}

/**
 * Translates the Tailwind classes of one slot of a style, such as Vega or Nova, into what `engine` can
 * render on one `part`: `icon` keeps the classes the style gives an svg with no size class, `text` the
 * typography classes, and `view` the rest.
 * A class with no rule is returned in `unknown`, in every part and every state, never guessed.
 * @param state - with no state, the classes the style puts behind no state; with one, only the classes
 * it puts behind exactly that state, its modifiers removed and `dark:` kept. Its parts may come in
 * any order.
 * @param slot - the slot's name and its style's spacing variables
 */
export function translateClasses(
  classes: readonly string[],
  engine: Engine,
  part: Part,
  state: StateKey = '',
  slot: SlotContext = {},
): Translation {
  const kept: string[] = [];
  const unknown: string[] = [];
  const renamed: Readonly<Record<string, string>> = RENAMED_UTILITIES[engine];
  const untranslatable: readonly RegExp[] = UNTRANSLATABLE_UTILITIES[engine];
  const wanted = stateKeyOf(state.split('+').filter(Boolean));
  const droppedByName = (slot.name === undefined ? undefined : SLOT_DROPPED_CLASSES.get(slot.name)) ?? new Set();
  const spacingVariables: SpacingVariables = slot.spacingVariables ?? new Map();
  const read = classes
    .filter((cls) => !droppedByName.has(cls))
    .flatMap((cls) => resolveSpacingVariables(readClass(cls), spacingVariables));

  const ringBorder = drawsRingAsBorder(read);

  for (const cls of read) {
    if (cls.reading === 'dropped') continue;
    if (cls.reading === 'unknown') {
      unknown.push(cls.source);
      continue;
    }
    const unmodified = cls.states.length === 0 && cls.kept.length === 0;
    const utility = resolveClampedRadius(
      resolveOwnSizeTranslate(ringBorder && unmodified ? ringAsBorder(cls.utility) : cls.utility, cls.states, read),
    );
    if (DROPPED_UTILITIES.some((rule) => rule.test(utility))) continue;
    if (untranslatable.some((rule) => rule.test(utility))) {
      unknown.push(cls.source);
      continue;
    }

    if (stateKeyOf(cls.states) !== wanted || partOf(utility, cls.onIcon) !== part) continue;
    kept.push([...cls.kept, renamed[utility] ?? utility].join(':'));
  }

  return { classes: [...new Set(kept)], unknown };
}
