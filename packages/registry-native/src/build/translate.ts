export type Engine = 'nativewind' | 'uniwind';
export type Part = 'view' | 'text' | 'icon';

export interface Translation {
  classes: string[];
  unknown: string[];
}

/** Modifiers React Native has a state for on a `Pressable`, under both engines. */
const KEPT_MODIFIERS: ReadonlySet<string> = new Set(['active', 'disabled', 'dark']);

/**
 * Modifiers whose condition always holds on React Native, so they are removed and the class kept:
 * a `Pressable` takes no `aria-haspopup`.
 */
const HOLDING_MODIFIERS: ReadonlySet<string> = new Set(['not-aria-[haspopup]']);

/**
 * Vega's selector for an svg inside the slot that names no size of its own. A class behind it goes to
 * the icon part with the selector removed, and Icon applies it only when it names no size itself.
 */
const ICON_MODIFIERS: ReadonlySet<string> = new Set(["[&_svg:not([class*='size-'])]"]);

/** No touch screen produces these states, so the class is dropped with its modifier. */
const DROPPED_MODIFIERS = [
  /^hover$/,
  /^focus-visible$/,
  /^aria-/,
  /^has-/,
  /^in-data-/,
  /^data-/,
  /^group-/,
  /^peer-/,
  /^not-/,
  /^\*{1,2}$/,
  /^\[&/,
  /^supports-/,
  /^print$/,
] as const satisfies readonly RegExp[];

/**
 * Utilities with nothing to draw on a device. The clamped radius is
 * `min(var(--radius-md), Npx)`, which neither engine evaluates. Vega clamps at 8px
 * or more, and the theme's `--radius-md` is 0.8 of a 0.625rem `--radius`, 8px, so
 * the clamp equals the slot's base `rounded-md`, which stands.
 */
const DROPPED_UTILITIES = [
  /^(outline|ring|ring-offset|transition|duration|ease|whitespace|cursor|scroll)(-|$)/,
  /^select-none$/,
  /^bg-clip-padding$/,
  /^group\//,
  /^rounded(-[a-z]+)?-\[min\(var\(--[\w-]+\),[\d.]+px\)\]$/,
] as const satisfies readonly RegExp[];

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
 * radius steps from `sm` to `4xl` to Vega's own on both engines, so only `rounded-xs`, which it
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
 * have an important to give it.
 */
const UNTRANSLATABLE_UTILITIES = {
  nativewind: [
    ...UNLOADED_WEIGHTS,
    /!$/,
    /^shadow-2xs$/,
    /^inset-shadow-/,
    /^inset-ring-/,
    /^bg-linear-/,
    /^field-sizing-/,
    /^text-shadow-/,
  ],
  uniwind: [...UNLOADED_WEIGHTS, /!$/],
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

/**
 * Translates the Tailwind classes of one Vega slot into what `engine` can
 * render on one `part`: `icon` keeps the classes Vega gives an svg with no size class, `text` the
 * typography classes, and `view` the rest.
 * A class with no rule is returned in `unknown`, in every part, never guessed.
 */
export function translateClasses(classes: readonly string[], engine: Engine, part: Part): Translation {
  const kept: string[] = [];
  const unknown: string[] = [];
  const renamed: Readonly<Record<string, string>> = RENAMED_UTILITIES[engine];
  const untranslatable: readonly RegExp[] = UNTRANSLATABLE_UTILITIES[engine];

  for (const cls of classes) {
    const variants = splitVariants(cls);
    const utility = variants.pop() ?? '';
    const modifiers = variants.filter((m) => !HOLDING_MODIFIERS.has(m) && !ICON_MODIFIERS.has(m));
    const onIcon = variants.some((m) => ICON_MODIFIERS.has(m));

    if (modifiers.some((m) => DROPPED_MODIFIERS.some((rule) => rule.test(m)))) continue;
    if (!modifiers.every((m) => KEPT_MODIFIERS.has(m))) {
      unknown.push(cls);
      continue;
    }
    if (DROPPED_UTILITIES.some((rule) => rule.test(utility))) continue;
    if (untranslatable.some((rule) => rule.test(utility))) {
      unknown.push(cls);
      continue;
    }

    if (partOf(utility, onIcon) !== part) continue;
    kept.push([...modifiers, renamed[utility] ?? utility].join(':'));
  }

  return { classes: kept, unknown };
}
