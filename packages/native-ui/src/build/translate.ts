import type { SlotMap } from './slot-map';

/** The styling engine a registry is built for, which decides the Tailwind a class must exist in. */
export type Engine = 'nativewind' | 'uniwind';

/**
 * The element of a component a class lands on: `view` the container, `text` its label, which takes
 * the typography a `Pressable` ignores, and `icon` an icon that names no size of its own.
 */
export type Part = 'view' | 'text' | 'icon';

/** What {@link translateClasses} gives back for one slot, part and state. */
export interface Translation {
  /** The classes the engine draws on the part, each once, in the slot's order. */
  classes: string[];
  /** The slot's classes no rule translates, as the style wrote them; any entry fails the build. */
  unknown: string[];
}

/**
 * The state a component applies a state token under: a word from one vocabulary for every component,
 * or a variant of the part or of its group, `<prop>=<value>`. A compound state joins its parts with
 * `+` in sorted order, as {@link stateKeyOf} writes it.
 */
export type StateKey = string;

/**
 * Modifiers both engines apply themselves: `active` and `disabled` from a `Pressable`'s state, and
 * `dark` from the colour scheme.
 */
const KEPT_MODIFIERS: ReadonlySet<string> = new Set(['active', 'disabled', 'dark']);

/**
 * Modifiers whose condition always holds on React Native, so they are removed and the class kept:
 * a `Pressable` takes no `aria-haspopup`.
 */
const HOLDING_MODIFIERS: ReadonlySet<string> = new Set(['not-aria-[haspopup]']);

/**
 * Upstream's selectors for an svg inside the slot, or directly inside it, that names no size of its own,
 * and for the accordion trigger's chevron, which upstream selects by its slot anywhere inside the trigger.
 * A class behind one goes to the icon part with the selector removed, and Icon applies it only when it
 * names no size itself.
 */
const ICON_MODIFIERS: ReadonlySet<string> = new Set([
  "[&_svg:not([class*='size-'])]",
  "[&>svg:not([class*='size-'])]",
  "*:[svg:not([class*='size-'])]",
  '**:data-[slot=accordion-trigger-icon]',
]);

/**
 * No touch screen produces these conditions, or nothing on a device matches the selector, so the
 * class is dropped with its modifier. A phone held upright is narrower than `sm`, so the base class a
 * style widens at `sm` or `md` stands. The styles put only exit animations behind `data-closed`, which
 * neither engine runs from these utilities.
 */
const DROPPED_MODIFIERS = [
  /^hover$/,
  /^focus-within$/,
  /^(sm|md)$/,
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
 * Each modifier a style puts a state behind, and the state it is. A menu item's `focus` is the item a
 * pointer, a key or a finger is on, which the component calls `highlighted`. A `group-`, `peer-` or
 * `has-` modifier, its `/<group>` name removed, is the same state on the part's group, sibling or child,
 * which the component knows as its own. A bare `disabled:` stays the `Pressable`'s own and reaches this table
 * only on a slot {@link SLOT_STATE_MODIFIERS} names; its `group-`, `peer-` and `has-` forms always do.
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
    focus: 'highlighted',
    'data-highlighted': 'highlighted',
    'data-inset': 'inset',
    'data-placeholder': 'placeholder',
    'aria-expanded': 'expanded',
    'data-open': 'open',
    'data-horizontal': 'orientation=horizontal',
    'data-vertical': 'orientation=vertical',
    first: 'position=first',
    last: 'position=last',
    'not-last': 'position=not-last',
  }),
);

/**
 * A state of the control inside the part, of a direct child the part holds, such as an icon in an
 * Alert or a group in a ButtonGroup, or of the part just before it, such as the legend a FieldDescription
 * follows, which upstream selects with an arbitrary selector the dropped rules would otherwise remove or
 * not read, and which the component learns from its control, its children or its parent.
 */
const CHILD_STATE_MODIFIERS: ReadonlyMap<string, StateKey> = new Map(
  Object.entries({
    'has-[[data-slot=input-group-control]:focus-visible]': 'focused',
    'has-[[data-slot][aria-invalid=true]]': 'invalid',
    'has-[>svg]': 'slot=icon',
    'has-[>[data-slot=button-group]]': 'slot=button-group',
    '[[data-variant=legend]+&]': 'after=legend',
  }),
);

/**
 * `*:data-[slot=<part>]`, the classes a slot gives its direct child of that slot, such as the colour a
 * destructive Alert gives its description, is the state `part=<part>`, which that child applies.
 */
const CHILD_SLOT = /^data-\[slot=([\w-]+)\]$/;
const CHILD_PART_MODIFIER = /^\*:data-\[slot=([\w-]+)\]$/;

/** `*:[svg...]`, upstream's other spelling of a direct child svg with no size of its own. */
const CHILD_ICON = "[svg:not([class*='size-'])]";

/** The slot `**:` selects as an icon anywhere inside the part; any other slot behind `**:` is dropped. */
const DESCENDANT_ICON_SLOT = 'data-[slot=accordion-trigger-icon]';

/**
 * A direct child in an alignment, such as `has-[>[data-align=block-end]]`, is the part's own variant
 * state `align=block-end`, which the component learns from its children. A direct child on any other
 * attribute stays dropped.
 */
const CHILD_VARIANT_MODIFIER = /^has-\[>\[data-(align)=([\w.-]+)\]\]$/;

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
 * Upstream's base layer colours every border `border-border`, and a device draws a border with no colour
 * black, so a slot that draws a border width and names no colour for it is given that colour after the
 * width, where a colour a variant's slot names after it still wins. A width behind a state is given it
 * too, unless the slot names a colour with no state, which the component applies beside the state.
 */
const BASE_BORDER_COLOUR = 'border-border';
const BORDER_STYLE = /^border-(dashed|solid|dotted|double|none|hidden)$/;
const BORDER_COLOUR = /^border(-[xytrblse])?-[a-z]/;

function namesBorderColour(utility: string): boolean {
  return BORDER_COLOUR.test(utility) && !BORDER_WIDTH.test(utility) && !BORDER_STYLE.test(utility);
}

/** `classes` with the base border colour after the first border width, when they name no colour. */
function withBaseBorderColour(classes: readonly string[]): string[] {
  const width = classes.findIndex((cls) => BORDER_WIDTH.test(cls) && !cls.endsWith('-0'));
  if (width === -1 || classes.some(namesBorderColour)) return [...classes];
  return [...classes.slice(0, width + 1), BASE_BORDER_COLOUR, ...classes.slice(width + 1)];
}

/**
 * Classes of one named slot that a device draws another way, unmodified as the styles write them. Upstream
 * centres the radio dot with an absolute 50% offset and a -50% translate; the indicator around it
 * already centres its child with flex, which both engines draw alike, where a percentage translate
 * is the engine's to resolve. The one-time code's caret blinks by an animation upstream
 * defines in its own stylesheet, which neither engine's theme carries, so the caret is drawn steady.
 * A dialog's content is as wide as the screen less 2rem, a percentage less a length neither engine
 * computes; its component holds it 1rem in from each edge instead.
 */
const SLOT_DROPPED_CLASSES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  [
    'cn-radio-group-indicator-icon',
    new Set(['absolute', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2']),
  ],
  ['cn-input-otp-caret-line', new Set(['animate-caret-blink'])],
  ['cn-dialog-content', new Set(['max-w-[calc(100%-2rem)]'])],
]);

/**
 * Modifiers of one named slot that are a state the component applies rather than kept for the engine.
 * Both engines key `disabled:` on a `disabled` prop, which a `TextInput` does not take, so a text
 * field's disabled classes go behind the `disabled` state its component applies while it is not editable.
 */
const SLOT_STATE_MODIFIERS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['cn-input', new Set(['disabled'])],
  ['cn-textarea', new Set(['disabled'])],
]);

/**
 * Slots whose important suffix is removed. Pagination's previous and next links mark their side padding
 * important to win over the Button size's; the component merges them after the Button's classes, where
 * tailwind-merge keeps both and each engine draws a side padding over the axis one, so the order wins
 * without the important neither engine has.
 */
const SLOT_IMPORTANT_REMOVED: ReadonlySet<string> = new Set(['cn-pagination-previous', 'cn-pagination-next']);
const IMPORTANT_SUFFIX = /!$/;

/**
 * Slots whose `::after` pseudo-element draws something a component draws as a child instead, so a class
 * behind `after:` is the state `part=after`, which that child applies, rather than dropped. The drawer's
 * swipe handle draws its bar this way.
 */
const SLOT_AFTER_PARTS: ReadonlySet<string> = new Set(['cn-drawer-swipe-handle']);
const AFTER_PART_MODIFIER = '*:data-[slot=after]';

/** The px of 1rem, which the theme's setup sets. */
const REM_PX = 16;

/** The px of one step of the spacing scale, 0.25rem. */
const SPACING_STEP_PX = REM_PX / 4;

/**
 * A radius of the theme's `--radius` less a length, which neither engine is sure to evaluate against a
 * rem variable, so it becomes the px it comes to at the theme's radius. A consumer who changes
 * `--radius` keeps the radius the build computed here.
 */
const RADIUS_LESS_LENGTH = /^rounded(-[a-z]+)?-\[calc\(var\(--radius\)-([\d.]+)px\)\]$/;
const REM_LENGTH = /^([\d.]+)rem$/;

/**
 * Utilities with nothing to draw on a device. Neither engine draws a `fit-content` width; a view is as
 * wide as its content once its parent does not stretch it, which the component sets with `self-start`.
 * React Native has no `text-wrap` to balance a line with, no overflow per axis (a ScrollView scrolls
 * one), and no table layout: no caption side and no vertical align in a cell, which a Table lays out
 * itself. Nor has it a grid or a block: a View stacks its children in a flex column, and a component
 * that sets two side by side lays out the row itself.
 */
const DROPPED_UTILITIES = [
  /^(outline|ring|ring-offset|transition|duration|ease|whitespace|cursor|scroll)(-|$)/,
  /^select-none$/,
  /^bg-clip-padding$/,
  /^group\//,
  /^w-fit$/,
  /^text-(balance|pretty)$/,
  /^overflow-[xy]-/,
  /^caption-(top|bottom)$/,
  /^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/,
  /^block$/,
  /^grid$/,
  /^grid-(rows|cols)-/,
  /^(row|col)-(span|start|end)-/,
] as const satisfies readonly RegExp[];

/**
 * A grid's `place-items-<align>`, which aligns each item across its cell; in the column a View stacks its
 * children in, that is the cross axis `items-<align>` aligns.
 */
const PLACE_ITEMS = /^place-items-(start|end|center|stretch|baseline)$/;

/** The web's `inline-flex`, which lays its children in a row; a View is a flex box already, in a column. */
const INLINE_FLEX = /^inline-flex$/;

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
 * A utility on the spacing scale. Tailwind 4 draws any multiple of 0.25 as a step, where Tailwind 3,
 * which NativeWind 4 runs on, draws only the steps of its default scale and nothing for another, such
 * as the `pr-18` an Alert makes room for its action with.
 */
const SPACING_STEP_UTILITY =
  /^(-?(?:p|m)[xytrblse]?|gap(?:-[xy])?|w|h|size|min-w|min-h|-?inset(?:-[xy])?|-?(?:top|right|bottom|left|start|end)|-?translate-[xy])-(\d+(?:\.\d+)?)$/;
const TAILWIND_3_SPACING_STEPS: ReadonlySet<string> = new Set(
  '0 0.5 1 1.5 2 2.5 3 3.5 4 5 6 7 8 9 10 11 12 14 16 20 24 28 32 36 40 44 48 52 56 60 64 72 80 96'.split(' '),
);

/** For NativeWind, a spacing step Tailwind 3 lacks as its px in an arbitrary value; any other utility as it is. */
function toTailwind3Spacing(utility: string, engine: Engine): string {
  const step = engine === 'nativewind' ? SPACING_STEP_UTILITY.exec(utility) : null;
  if (!step || TAILWIND_3_SPACING_STEPS.has(step[2])) return utility;
  return `${step[1]}-[${Number(step[2]) * SPACING_STEP_PX}px]`;
}

/**
 * Renames on both engines. React Native has no fixed position; an overlay's parts are drawn in a portal host
 * that fills the screen, where an absolute position is the fixed one.
 */
const SHARED_RENAMED_UTILITIES = {
  ...GEIST_FAMILY_UTILITIES,
  fixed: 'absolute',
} as const satisfies Readonly<Record<string, string>>;

/**
 * NativeWind 4 runs on Tailwind 3, whose scale steps are one below Tailwind 4's. A Tailwind 4 step
 * past the end of Tailwind 3's scale takes its value as an arbitrary one. The theme item sets the
 * radius steps from `sm` to `4xl` to upstream's own on both engines, so only `rounded-xs`, which it
 * leaves at Tailwind 4's 0.125rem and Tailwind 3 lacks, is renamed.
 */
const RENAMED_UTILITIES = {
  nativewind: {
    ...SHARED_RENAMED_UTILITIES,
    'shadow-xs': 'shadow-sm',
    'shadow-sm': 'shadow',
    'rounded-xs': 'rounded-[0.125rem]',
    'blur-xs': 'blur-sm',
    'drop-shadow-xs': 'drop-shadow-sm',
  },
  uniwind: SHARED_RENAMED_UTILITIES,
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
  const childState = CHILD_STATE_MODIFIERS.get(modifier);
  if (childState) return childState;
  const childVariant = CHILD_VARIANT_MODIFIER.exec(modifier);
  if (childVariant) return `${childVariant[1]}=${childVariant[2]}`;
  const childPart = CHILD_PART_MODIFIER.exec(modifier);
  if (childPart) return `part=${childPart[1]}`;
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

/**
 * Joins each `*` with the modifier after it when the pair names a direct child the build reads, and
 * each `**` when the pair names the descendant icon it reads.
 */
function joinChildModifiers(modifiers: readonly string[]): string[] {
  const joined: string[] = [];
  for (let i = 0; i < modifiers.length; i += 1) {
    const next = modifiers[i + 1];
    if (modifiers[i] === '*' && next !== undefined && (next === CHILD_ICON || CHILD_SLOT.test(next))) {
      joined.push(`*:${next}`);
      i += 1;
    } else if (modifiers[i] === '**' && next === DESCENDANT_ICON_SLOT) {
      joined.push(`**:${next}`);
      i += 1;
    } else {
      joined.push(modifiers[i]);
    }
  }
  return joined;
}

function readClass(cls: string, stateModifiers: ReadonlySet<string> = new Set(), afterPart = false): SlotClass {
  const split = splitVariants(cls);
  const utility = split.pop() ?? '';
  const variants = joinChildModifiers(split);
  const modifiers = variants
    .filter((m) => !HOLDING_MODIFIERS.has(m) && !ICON_MODIFIERS.has(m))
    .map((m) => (afterPart && m === 'after' ? AFTER_PART_MODIFIER : m));
  const isChildState = (m: string): boolean => CHILD_STATE_MODIFIERS.has(m) || CHILD_VARIANT_MODIFIER.test(m);
  if (modifiers.some((m) => !isChildState(m) && DROPPED_MODIFIERS.some((rule) => rule.test(m)))) {
    return { reading: 'dropped' };
  }

  const kept: string[] = [];
  const states: string[] = [];
  for (const modifier of modifiers) {
    if (KEPT_MODIFIERS.has(modifier) && !stateModifiers.has(modifier)) {
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
    for (const cls of classes.map((cls) => readClass(cls))) {
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

/**
 * The px radius a radius less a length comes to at the theme's `radius`, such as `0.625rem`, rounded to
 * 2 decimals and no less than 0; with no radius, or one not in rem, `undefined`, so the class is reported.
 * Any other utility is returned as it is.
 */
function resolveRadiusLessLength(utility: string, radius: string | undefined): string | undefined {
  const less = RADIUS_LESS_LENGTH.exec(utility);
  if (!less) return utility;
  const rem = radius === undefined ? undefined : REM_LENGTH.exec(radius.trim());
  if (!rem) return undefined;
  const px = Math.max(0, Number(rem[1]) * REM_PX - Number(less[2]));
  return `rounded${less[1] ?? ''}-[${Math.round(px * 100) / 100}px]`;
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
   * lists for it and reads the modifiers {@link SLOT_STATE_MODIFIERS} lists for it as states; with
   * none, no class is dropped or read as a state by name.
   */
  name?: string;
  /**
   * The spacing variables of the slot's style, from {@link parseSpacingVariables}; with none, every
   * definition and read of a spacing variable is unknown.
   */
  spacingVariables?: SpacingVariables;
  /**
   * The theme's `--radius`, such as `0.625rem`, which a radius less a length is computed from; with
   * none, every such radius is unknown.
   */
  radius?: string;
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
  const stateModifiers = (slot.name === undefined ? undefined : SLOT_STATE_MODIFIERS.get(slot.name)) ?? new Set();
  const spacingVariables: SpacingVariables = slot.spacingVariables ?? new Map();
  const importantRemoved = slot.name !== undefined && SLOT_IMPORTANT_REMOVED.has(slot.name);
  const afterPart = slot.name !== undefined && SLOT_AFTER_PARTS.has(slot.name);
  const read = classes
    .filter((cls) => !droppedByName.has(cls))
    .map((cls) => (importantRemoved ? cls.replace(IMPORTANT_SUFFIX, '') : cls))
    .flatMap((cls) => resolveSpacingVariables(readClass(cls, stateModifiers, afterPart), spacingVariables));

  const ringBorder = drawsRingAsBorder(read);

  for (const cls of read) {
    if (cls.reading === 'dropped') continue;
    if (cls.reading === 'unknown') {
      unknown.push(cls.source);
      continue;
    }
    const unmodified = cls.states.length === 0 && cls.kept.length === 0;
    const radiusLessLength = resolveRadiusLessLength(cls.utility, slot.radius);
    if (radiusLessLength === undefined) {
      unknown.push(cls.source);
      continue;
    }
    const utility = resolveClampedRadius(
      resolveOwnSizeTranslate(
        ringBorder && unmodified ? ringAsBorder(radiusLessLength) : radiusLessLength,
        cls.states,
        read,
      ),
    )
      .replace(PLACE_ITEMS, 'items-$1')
      .replace(INLINE_FLEX, 'flex-row');
    if (DROPPED_UTILITIES.some((rule) => rule.test(utility))) continue;
    if (untranslatable.some((rule) => rule.test(utility))) {
      unknown.push(cls.source);
      continue;
    }

    if (stateKeyOf(cls.states) !== wanted || partOf(utility, cls.onIcon) !== part) continue;
    const drawn = Object.hasOwn(renamed, utility) ? renamed[utility] : toTailwind3Spacing(utility, engine);
    kept.push([...cls.kept, drawn].join(':'));
  }

  const baseNamesColour = read.some(
    (cls) =>
      cls.reading === 'read' && cls.states.length === 0 && cls.kept.length === 0 && namesBorderColour(cls.utility),
  );
  const drawn = part === 'view' && (wanted === '' || !baseNamesColour) ? withBaseBorderColour(kept) : kept;
  return { classes: [...new Set(drawn)], unknown };
}
