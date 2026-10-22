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
 * neither engine runs from these utilities, and base-ui's `data-starting-style` and `data-ending-style` hold
 * the frames an enter or exit animation starts and ends on, which a component draws with Reanimated. A
 * navigation menu's `data-[motion=...]` slides one item's content out and the next in within one shared
 * popup, where each item here opens a popup of its own. `[a]:` styles a marker rendered as a link by its tag,
 * which no element on a device has.
 */
const DROPPED_MODIFIERS = [
  /^hover$/,
  /^peer-hover(\/[\w-]+)?$/,
  /^focus-within$/,
  /^(sm|md)$/,
  /^print$/,
  /^file$/,
  /^after$/,
  /^data-closed$/,
  /^data-(starting|ending)-style$/,
  /^data-\[motion/,
  /^has-data-\[icon=inline-(start|end)\]$/,
  /^(group-)?(not-)?has-\[/,
  /^in-data-\[slot=/,
  /^\*{1,2}$/,
  /^\[&/,
  /^\[\./,
  /^\[a\]$/,
  /^supports-/,
] as const satisfies readonly RegExp[];

/**
 * Each modifier a style puts a state behind, and the state it is. `focus` is `highlighted` on every slot:
 * the part a pointer, a key or a finger is on, which a component applies itself, since a device has no
 * focus a press moves; a part whose focus is its keyboard focus uses `focus-visible`. A `group-`, `peer-` or
 * `has-` modifier, its `/<group>` name removed, is the same state on the part's group, sibling or child,
 * which the component knows as its own. A bare `disabled:` stays the `Pressable`'s own and reaches this table
 * only on a slot {@link SLOT_STATE_MODIFIERS} names; its `group-`, `peer-` and `has-` forms always do.
 * `[button,a]` selects a part rendered as a button or a link, which is `pressable`: the component knows it
 * renders a pressable child in its place.
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
    hover: 'hovered',
    'data-focus-visible': 'focused',
    focus: 'highlighted',
    'data-highlighted': 'highlighted',
    'data-inset': 'inset',
    'data-placeholder': 'placeholder',
    'data-empty': 'empty',
    'aria-expanded': 'expanded',
    'data-open': 'open',
    'data-popup-open': 'open',
    'in-data-numbered': 'numbered',
    'data-horizontal': 'orientation=horizontal',
    'data-vertical': 'orientation=vertical',
    first: 'position=first',
    last: 'position=last',
    'not-last': 'position=not-last',
    '[button,a]': 'pressable',
    'focus-within': 'focused',
  }),
);

/**
 * cmdk's group heading, which upstream selects by its attribute anywhere inside a Command's group; the
 * group draws the heading itself, as its `group-heading` part.
 */
const COMMAND_GROUP_HEADING = '**:[[cmdk-group-heading]]';

/**
 * A state of the control inside the part, of a direct child the part holds, such as an icon in an
 * Alert or a group in a ButtonGroup, of a part before it, such as the legend a FieldDescription follows or the
 * title a TraceIcon comes after, of a part after it, such as the description whose absence spaces a
 * QuestionnaireTitle from the choices, or of the part it sits straight inside, such as CodeBlockActions floating in
 * a CodeBlock rather than sitting in its header, which upstream selects with an arbitrary selector the dropped rules
 * would otherwise remove or not read, and which the component learns from its control, its children or its parent.
 * A questionnaire choice is ringed while the hidden input it holds on the web has keyboard focus, which the native
 * choice, being the control itself, knows as its own focus.
 */
const CHILD_STATE_MODIFIERS: ReadonlyMap<string, StateKey> = new Map(
  Object.entries({
    'has-[[data-slot=input-group-control]:focus-visible]': 'focused',
    'has-[[data-slot][aria-invalid=true]]': 'invalid',
    'has-[>svg]': 'slot=icon',
    'has-[>[data-slot=button-group]]': 'slot=button-group',
    '[[data-variant=legend]+&]': 'after=legend',
    '[[data-slot=trace-title]~&]': 'after=trace-title',
    'has-[>input:focus-visible]': 'focused',
    '[&:not(:has(~[data-slot=questionnaire-description]))]': 'description=none',
    '[[data-slot=code-block]>&]': 'parent=code-block',
    'has-[>[data-slot=code-block-content]:focus-visible]': 'focused',
    [COMMAND_GROUP_HEADING]: 'part=group-heading',
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

/**
 * `*:[button]`, the classes a slot gives each button straight inside it, such as the background of a code
 * block's floating actions, is the state `part=button`, which the component gives each child it holds.
 */
const CHILD_BUTTON = '[button]';
const CHILD_BUTTON_MODIFIER = `*:${CHILD_BUTTON}`;

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
 * border of its own is given one, and a ring behind a state other than {@link RING_AS_BORDER_STATE}, `ring-0` and any
 * other width stay dropped.
 */
const RING_WIDTH_UTILITY = 'ring-1';

/**
 * The child state whose ring is drawn as a border too: the hairline a code block's floating actions put
 * around each of their buttons, which a Button draws with no ring of its own to lose.
 */
const RING_AS_BORDER_STATE = 'part=button';

/**
 * Slots whose ring behind one state is drawn as a border too: an attachment's focus ring, around a card that
 * draws its hairline as a border already, so the border takes the ring's colour while focused, a trace
 * trigger's, whose component draws a transparent border for it, and a code block's, whose variant draws a
 * border already.
 */
const SLOT_RING_AS_BORDER_STATES: ReadonlyMap<string, StateKey> = new Map([
  ['cn-attachment', 'focused'],
  ['cn-trace-collapsible-trigger', 'focused'],
  ['cn-code-block', 'focused'],
]);
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
 * computes; its component holds it 1rem in from each edge instead. A bubble's reactions overlap its edge by
 * three quarters of their own height, which the component measures and offsets them by, since a percentage
 * translate is the engine's to resolve.
 */
const SLOT_DROPPED_CLASSES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  [
    'cn-radio-group-indicator-icon',
    new Set(['absolute', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2']),
  ],
  ['cn-input-otp-caret-line', new Set(['animate-caret-blink'])],
  ['cn-dialog-content', new Set(['max-w-[calc(100%-2rem)]'])],
  ['cn-calendar', new Set(['[--cell-radius:var(--radius-md)]'])],
  ['cn-bubble-reactions-side-top', new Set(['-translate-y-3/4'])],
  ['cn-bubble-reactions-side-bottom', new Set(['translate-y-3/4'])],
]);

/**
 * Classes of one named slot that a device draws with another class, each to the one it becomes. A tinted
 * bubble mixes the primary colour to a fixed lightness with the relative colour syntax, which neither engine
 * parses; the primary colour at a low opacity over the background comes to about the same lightness in the
 * neutral theme. A bubble's reactions are ringed in the card colour by a box-shadow, which a device has no
 * counterpart of, so the ring becomes a border as wide; the reactions are placed absolutely, so the border
 * moves nothing around them.
 */
const SLOT_REPLACED_CLASSES: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([
  [
    'cn-bubble-variant-tinted',
    new Map([
      [
        '*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)]',
        '*:data-[slot=bubble-content]:bg-primary/10',
      ],
      [
        'dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)]',
        'dark:*:data-[slot=bubble-content]:bg-primary/15',
      ],
    ]),
  ],
  [
    'cn-bubble-reactions',
    new Map([
      ['ring-3', 'border-[3px]'],
      ['ring-card', 'border-card'],
    ]),
  ],
]);

/**
 * Classes upstream's component writes inline that read a variable the slot defines, which the build adds
 * to the slot behind the part state of the child that applies them, so the child takes the style's value.
 * A calendar's day cells and navigation buttons are `--cell-size` square, its weekday columns that wide,
 * and its caption that high with that room either side for the buttons. Upstream's `--cell-radius` is
 * `--radius-md` in every style, which the component writes as `rounded-md`, so its definition is dropped.
 */
const SLOT_COMPONENT_CLASSES: ReadonlyMap<string, readonly string[]> = new Map([
  [
    'cn-calendar',
    [
      '*:data-[slot=cell]:size-(--cell-size)',
      '*:data-[slot=column]:w-(--cell-size)',
      '*:data-[slot=caption]:h-(--cell-size)',
      '*:data-[slot=caption]:px-(--cell-size)',
    ],
  ],
]);

/**
 * Modifiers of one named slot that are a state the component applies rather than kept for the engine.
 * Both engines key `disabled:` on a `disabled` prop, which a `TextInput` does not take, so a text
 * field's disabled classes go behind the `disabled` state its component applies while it is not editable.
 * A sidebar menu item's action and badge take the accent colour while the pointer is over the item's button,
 * which the component tracks on the web, so their `peer-hover` classes go behind the `hovered` state rather
 * than being dropped with every other hover. An attachment is ringed while a control inside it holds focus,
 * which its trigger reports to the card as keyboard focus, so its `focus-within` classes go behind `focused`.
 */
const SLOT_STATE_MODIFIERS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['cn-input', new Set(['disabled'])],
  ['cn-textarea', new Set(['disabled'])],
  ['cn-sidebar-menu-action', new Set(['peer-hover/menu-button'])],
  ['cn-sidebar-menu-badge', new Set(['peer-hover/menu-button'])],
  ['cn-attachment', new Set(['focus-within'])],
]);

/**
 * Slots whose important suffix is removed. Pagination's previous and next links mark their side padding
 * important to win over the Button size's; the component merges them after the Button's classes, where
 * tailwind-merge keeps both and each engine draws a side padding over the axis one, so the order wins
 * without the important neither engine has. A Command marks its rounding, and its input group the height,
 * rounding and shadow, important over the Dialog's and the InputGroup's, which they are merged after. A
 * sidebar's menu button marks its size and padding in a rail of icons important over its size's, which the
 * component merges after them. Attachment media marks the size of a spinner in a vertical attachment important over
 * the spinner's own, which the spinner merges after it.
 */
const SLOT_IMPORTANT_REMOVED: ReadonlySet<string> = new Set([
  'cn-pagination-previous',
  'cn-pagination-next',
  'cn-command',
  'cn-command-dialog',
  'cn-command-input-group',
  'cn-sidebar-menu-button',
  'cn-sidebar-menu-button-size-lg',
  'cn-attachment-media',
]);
const IMPORTANT_SUFFIX = /!$/;

/**
 * Slots whose `::after` pseudo-element draws something a component draws as a child instead, so a class
 * behind `after:` is the state `part=after`, which that child applies, rather than dropped. The drawer's
 * swipe handle draws its bar this way, and a code block's line its diff marker, whose sign the component
 * writes, so the `content-[...]` that sets it on the web is dropped. A separator marker draws the line after its
 * text this way, and the line before it with `::before`.
 */
const SLOT_AFTER_PARTS: ReadonlySet<string> = new Set([
  'cn-drawer-swipe-handle',
  'cn-code-block-line',
  'cn-code-block-line-variant-added',
  'cn-code-block-line-variant-removed',
  'cn-marker-variant-separator',
]);
const AFTER_PART_MODIFIER = '*:data-[slot=after]';

/**
 * Slots whose `::before` pseudo-element draws something a component draws as a child instead, so a class
 * behind `before:` is the state `part=before`, which that child applies. A code block's line draws its
 * number this way, and a separator marker the line before its text.
 */
const SLOT_BEFORE_PARTS: ReadonlySet<string> = new Set(['cn-code-block-line', 'cn-marker-variant-separator']);
const BEFORE_PART_MODIFIER = '*:data-[slot=before]';

/** The text a pseudo-element draws, which a component that draws the part as a child writes itself. */
const PSEUDO_CONTENT = /^content-\[/;

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
 * one, and hides its scrollbar by a prop), and no table layout: no caption side and no vertical align in a cell, which a Table lays out
 * itself. Nor has it a grid or a block: a View stacks its children in a flex column, and a component
 * that sets two side by side lays out the row itself.
 */
const DROPPED_UTILITIES = [
  /^(outline|ring|ring-offset|transition|duration|ease|whitespace|cursor|scroll)(-|$)/,
  /^select-none$/,
  /^bg-clip-padding$/,
  /^no-scrollbar$/,
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

/** A colour made from a theme colour with the relative colour syntax, such as `oklch(from var(--primary) ...)`. */
const RELATIVE_COLOUR = /\[oklch\(from_/;

/** Weights the theme has no Geist family for, so a font cannot draw them. */
const UNLOADED_WEIGHTS = [/^font-(thin|extralight|light|extrabold|black)$/] as const satisfies readonly RegExp[];

/**
 * Tailwind 4 utilities the engine's Tailwind has no exact equal of, reported rather than renamed to
 * a near one. The `!` suffix is Tailwind 4's spelling of important; neither engine's native styles
 * have an important to give it. Neither engine computes a calc that mixes a percentage with a length,
 * nor a radius clamped below `rounded-md`, nor parses a colour made from another with the relative colour syntax.
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
    RELATIVE_COLOUR,
  ],
  uniwind: [...UNLOADED_WEIGHTS, /!$/, /\[calc\([^\]]*%/, CLAMPED_RADIUS, RELATIVE_COLOUR],
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
  if (modifier === CHILD_BUTTON_MODIFIER) return 'part=button';
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
    if (
      modifiers[i] === '*' &&
      next !== undefined &&
      (next === CHILD_ICON || next === CHILD_BUTTON || CHILD_SLOT.test(next))
    ) {
      joined.push(`*:${next}`);
      i += 1;
    } else if (modifiers[i] === '**' && (next === DESCENDANT_ICON_SLOT || `**:${next}` === COMMAND_GROUP_HEADING)) {
      joined.push(`**:${next}`);
      i += 1;
    } else {
      joined.push(modifiers[i]);
    }
  }
  return joined;
}

function readClass(
  cls: string,
  stateModifiers: ReadonlySet<string> = new Set(),
  afterPart = false,
  beforePart = false,
): SlotClass {
  const split = splitVariants(cls);
  const utility = split.pop() ?? '';
  const variants = joinChildModifiers(split);
  const modifiers = variants
    .filter((m) => !HOLDING_MODIFIERS.has(m) && !ICON_MODIFIERS.has(m))
    .map((m) => (afterPart && m === 'after' ? AFTER_PART_MODIFIER : m))
    .map((m) => (beforePart && m === 'before' ? BEFORE_PART_MODIFIER : m));
  if ((afterPart || beforePart) && PSEUDO_CONTENT.test(utility)) {
    return { reading: 'dropped' };
  }
  const isChildState = (m: string): boolean => CHILD_STATE_MODIFIERS.has(m) || CHILD_VARIANT_MODIFIER.test(m);
  const dropped = (m: string): boolean =>
    !isChildState(m) && !stateModifiers.has(m) && DROPPED_MODIFIERS.some((rule) => rule.test(m));
  if (modifiers.some(dropped)) {
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

/**
 * A height of N spacing steps less M, clamped to the screen's available height less M, which only the
 * web's popup positioner gives as a variable. A device's popup is held to the screen already, so the
 * clamp becomes the px of N less M steps.
 */
const AVAILABLE_HEIGHT_CLAMP =
  /^max-h-\[min\(calc\(--spacing\(([\d.]+)\)---spacing\(([\d.]+)\)\),calc\(var\(--available-height\)---spacing\(\2\)\)\)\]$/;

function resolveAvailableHeightClamp(utility: string): string {
  const clamp = AVAILABLE_HEIGHT_CLAMP.exec(utility);
  if (!clamp) return utility;
  return `max-h-[${(Number(clamp[1]) - Number(clamp[2])) * SPACING_STEP_PX}px]`;
}

/**
 * A length of N spacing steps, or of N steps less M px, written with Tailwind 4's `--spacing()`, which
 * Tailwind 3 does not compile and Uniwind does not evaluate inside an arbitrary value, such as a trace's
 * content indented to line up with the middle of the icon above it. It becomes the px it comes to.
 */
const SPACING_FUNCTION =
  /^(-?[a-z]+(?:-[a-z]+)*)-\[(?:--spacing\(([\d.]+)\)|calc\(--spacing\(([\d.]+)\)-([\d.]+)px\))\]$/;

function resolveSpacingFunction(utility: string): string {
  const length = SPACING_FUNCTION.exec(utility);
  if (!length) return utility;
  const [, prefix, steps, calcSteps, less] = length;
  const px = Number(steps ?? calcSteps) * SPACING_STEP_PX - Number(less ?? 0);
  return `${prefix}-[${Math.round(px * 100) / 100}px]`;
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
  const beforePart = slot.name !== undefined && SLOT_BEFORE_PARTS.has(slot.name);
  const componentClasses = (slot.name === undefined ? undefined : SLOT_COMPONENT_CLASSES.get(slot.name)) ?? [];
  const replacedByName = (slot.name === undefined ? undefined : SLOT_REPLACED_CLASSES.get(slot.name)) ?? new Map();
  const read = [...classes, ...componentClasses]
    .filter((cls) => !droppedByName.has(cls))
    .map((cls) => replacedByName.get(cls) ?? cls)
    .map((cls) => (importantRemoved ? cls.replace(IMPORTANT_SUFFIX, '') : cls))
    .flatMap((cls) => resolveSpacingVariables(readClass(cls, stateModifiers, afterPart, beforePart), spacingVariables));

  const ringBorder = drawsRingAsBorder(read);
  const ringStateAsBorder = slot.name === undefined ? undefined : SLOT_RING_AS_BORDER_STATES.get(slot.name);

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
    const utility = resolveSpacingFunction(
      resolveAvailableHeightClamp(
        resolveClampedRadius(
          resolveOwnSizeTranslate(
            (ringBorder && unmodified) ||
              cls.states.includes(RING_AS_BORDER_STATE) ||
              (ringStateAsBorder !== undefined && stateKeyOf(cls.states) === ringStateAsBorder)
              ? ringAsBorder(radiusLessLength)
              : radiusLessLength,
            cls.states,
            read,
          ),
        ),
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
