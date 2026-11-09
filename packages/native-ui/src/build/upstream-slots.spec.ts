import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PROJECT = join(__dirname, '../..');
const UPSTREAM = dirname(require.resolve('@zeroxsolutions/shadcn-upstream/snapshot/base-item-slots.json'));

/**
 * Slots that hold only a transition, and for the navigation menu's positioner the hover bridge drawn before
 * it, on boxes a native item draws as an Animated.View or not at all.
 */
const MOTION_ONLY = ['cn-sidebar-gap', 'cn-trace-collapsible-content', 'cn-navigation-menu-positioner'];

/** A class a motion-only slot may hold: a transition, its timing, or a part drawn before the box. */
const MOTION_CLASS = /^(?:[^:]+:)*(?:before:\S+|(?:transition|duration|ease)(?:-\S+)?)$/;

/**
 * The slots upstream's base items write that no native item writes, each with what stops a native item
 * from drawing it.
 */
const NOT_DRAWN_ON_NATIVE: ReadonlyMap<string, string> = new Map([
  ...[
    'cn-combobox-content-logical',
    'cn-context-menu-content-logical',
    'cn-dropdown-menu-content-logical',
    'cn-hover-card-content-logical',
    'cn-menubar-content-logical',
    'cn-popover-content-logical',
    'cn-select-content-logical',
    'cn-tooltip-content-logical',
    'cn-tooltip-arrow-logical',
  ].map((slot): [string, string] => [
    slot,
    'places a popup on an inline-start or inline-end side; a native popup opens on top, right, bottom or left',
  ]),
  [
    'cn-menu-translucent',
    "a web project's menuColor chooses it; the native registries are built for the default, which leaves it out",
  ],
  ['cn-scroll-area-scrollbar', "the platform draws a ScrollView's scroll indicator"],
  ['cn-scroll-area-thumb', "the platform draws a ScrollView's scroll indicator"],
  ...MOTION_ONLY.map((slot): [string, string] => [
    slot,
    'holds only motion, which the item runs in code; its box is an Animated.View, or no view at all',
  ]),
]);

const styleSheets = readdirSync(UPSTREAM)
  .filter((name) => /^style-[a-z]+\.css$/.test(name))
  .map((name) => readFileSync(join(UPSTREAM, name), 'utf8'));

/** Every slot any of the eight style sheets defines. */
function styleSlots(): Set<string> {
  return new Set(styleSheets.flatMap((css) => [...css.matchAll(/\.(cn-[a-z0-9-]+)\s*\{/g)].map(([, slot]) => slot)));
}

/** The classes `slot` applies in each style sheet that defines it. */
function classesOf(slot: string): string[] {
  return styleSheets.flatMap((css) =>
    [...css.matchAll(new RegExp(`\\.${slot}\\s*\\{\\s*@apply([^;]*);`, 'g'))].flatMap(([, classes]) =>
      classes.trim().split(/\s+/),
    ),
  );
}

/** The source of every native item, specs and test helpers left out. */
function nativeSources(directory = join(PROJECT, 'src/registry')): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return nativeSources(path);
    return /\.tsx?$/.test(name) && !/\.(spec|testing)\.tsx?$/.test(name) ? [readFileSync(path, 'utf8')] : [];
  });
}

const slots = styleSlots();
const baseItemSlots = JSON.parse(readFileSync(join(UPSTREAM, 'base-item-slots.json'), 'utf8')) as Record<
  string,
  string[]
>;
const upstream = new Set(
  Object.values(baseItemSlots)
    .flat()
    .filter((token) => slots.has(token)),
);
const native = new Set(
  nativeSources()
    .flatMap((source) => source.match(/\bcn-[a-z0-9-]+/g) ?? [])
    .filter((token) => slots.has(token)),
);

describe("the native items against upstream's base items", () => {
  it('reads the base items and the style sheets', () => {
    expect(upstream.size).toBeGreaterThan(0);
    expect(slots.size).toBeGreaterThan(0);
  });

  it('writes every slot a base item writes, or says why it cannot', () => {
    expect([...upstream].filter((slot) => !native.has(slot) && !NOT_DRAWN_ON_NATIVE.has(slot))).toEqual([]);
  });

  it('writes no slot that only another base writes', () => {
    expect([...native].filter((slot) => !upstream.has(slot))).toEqual([]);
  });

  it("finds only motion in the slots it leaves to the items' code", () => {
    expect(MOTION_ONLY.flatMap(classesOf).filter((cls) => !MOTION_CLASS.test(cls))).toEqual([]);
    expect(MOTION_ONLY.flatMap(classesOf).length).toBeGreaterThan(0);
  });

  it('lists only slots a base item still writes and no native item does', () => {
    expect([...NOT_DRAWN_ON_NATIVE.keys()].filter((slot) => !upstream.has(slot) || native.has(slot))).toEqual([]);
  });
});
