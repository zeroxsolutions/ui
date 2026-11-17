/** A registry item, as far as the icon sets read it: its name and where its files sit. */
interface IconRegistryItem {
  name: string;
  files?: readonly { path: string }[];
}

/** One set of animated icons, `lucide` for one, and its icons, each by its registry item and its glyph. */
export interface IconSet {
  set: string;
  icons: { name: string; glyph: string }[];
}

/** A file under `icons/<set>/`, named for its glyph. */
const ICON_FILE = /(?:^|\/)icons\/([^/]+)\/([^/]+)-icon\.tsx$/;

/**
 * The animated icons among `items`, grouped by set in the order a set first appears, each set's icons
 * ordered by glyph. An item is an icon when one of its files sits under `icons/<set>/`, as both
 * platforms' registries lay them out.
 */
export function iconSets(items: readonly IconRegistryItem[]): IconSet[] {
  const sets = new Map<string, IconSet['icons']>();
  for (const item of items) {
    const match = item.files?.map((file) => ICON_FILE.exec(file.path)).find((found) => found !== null);
    if (!match) continue;
    const [, set, glyph] = match;
    sets.set(set, [...(sets.get(set) ?? []), { name: item.name, glyph }]);
  }
  return [...sets].map(([set, icons]) => ({
    set,
    icons: icons.sort((a, b) => a.glyph.localeCompare(b.glyph)),
  }));
}

/** `query` as a glyph name: lower case, its words joined by `-`, so `Arrow Up` reads as `arrow-up`. */
function glyphQuery(query: string): string {
  return query.trim().toLowerCase().split(/\s+/).join('-');
}

/** The icons of `sets` whose glyph holds `query`, read as a glyph name; a set left with none is dropped. */
export function filterIconSets(sets: readonly IconSet[], query: string): IconSet[] {
  const wanted = glyphQuery(query);
  return sets
    .map(({ set, icons }) => ({ set, icons: icons.filter(({ glyph }) => glyph.includes(wanted)) }))
    .filter(({ icons }) => icons.length > 0);
}
