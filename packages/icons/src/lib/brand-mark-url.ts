import { BRAND_MARKS, type BrandMarkName } from './brand-manifest';

/** How a brand mark draws: its own colours, one colour, on a filled tile, or beside its wordmark. */
export type BrandMarkVariant = 'color' | 'mono' | 'avatar' | 'combine';

/** Where the artwork is served unless a caller says otherwise: `<base>/<variant>/<name>.svg`. */
export const DEFAULT_BRAND_MARK_BASE = 'https://icons.zeroxsolutions.com/brands';

const NEXT: Record<BrandMarkVariant, BrandMarkVariant | undefined> = {
  combine: 'color',
  avatar: 'color',
  color: 'mono',
  mono: undefined,
};

// Widened so a name missing from the manifest (runtime data cast to BrandMarkName) reads as a mark
// with no files, falling to the letter, instead of throwing on an undefined entry.
const MARKS: Readonly<Record<string, Partial<Record<BrandMarkVariant, number>>>> = BRAND_MARKS;

let configuredBase: string | undefined;
let configuredStyle: BrandMarkVariant | undefined;

/** Serve every mark from `base`; `undefined` returns to {@link DEFAULT_BRAND_MARK_BASE}. A per-call `base` wins. */
export function setBrandMarkBase(base: string | undefined): void {
  configuredBase = base;
}

/** The variant a call without its own resolves to; `undefined` returns to `'color'`. */
export function setBrandMarkStyle(variant: BrandMarkVariant | undefined): void {
  configuredStyle = variant;
}

/** The module's current default variant. */
export function getBrandMarkStyle(): BrandMarkVariant {
  return configuredStyle ?? 'color';
}

/** `variant` and the variants after it, in fallback order, keeping only those `name` has a file for. */
export function brandMarkChain(name: BrandMarkName, variant: BrandMarkVariant): BrandMarkVariant[] {
  const has = MARKS[name] ?? {};
  const chain: BrandMarkVariant[] = [];
  for (let v: BrandMarkVariant | undefined = variant; v; v = NEXT[v]) if (v in has) chain.push(v);
  return chain;
}

/** Width over height of `name`'s `variant` file; 1 where it has none. */
export function brandMarkRatio(name: BrandMarkName, variant: BrandMarkVariant): number {
  return (MARKS[name] ?? {})[variant] ?? 1;
}

/** The URL of `name`'s `variant` file on `base`, the module base, or the default, in that order. */
export function brandMarkUrlFor(name: BrandMarkName, variant: BrandMarkVariant, base?: string): string {
  const root = (base ?? configuredBase ?? DEFAULT_BRAND_MARK_BASE).replace(/\/+$/, '');
  return `${root}/${variant}/${name}.svg`;
}

/** The URL of `name`'s file for `variant`, or `undefined` where it has none, for callers outside React. */
export function brandMarkUrl(
  name: BrandMarkName,
  options: { variant?: BrandMarkVariant; base?: string } = {},
): string | undefined {
  const variant = options.variant ?? getBrandMarkStyle();
  return variant in (MARKS[name] ?? {}) ? brandMarkUrlFor(name, variant, options.base) : undefined;
}
