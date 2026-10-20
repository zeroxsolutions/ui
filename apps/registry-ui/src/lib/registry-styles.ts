/** The shadcn base styles zui publishes every web item under, one `/r/styles/base-<style>/` directory each. */
export const BASE_STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const;

export type BaseStyle = (typeof BASE_STYLES)[number];

/** The style the items' own classes are drawn in, and where the old `/r/<name>.json` paths redirect. */
export const DEFAULT_BASE_STYLE: BaseStyle = 'nova';

/** The site path of an item's JSON, or of the index when `name` is `registry`. */
export function itemPath(name: string, style: BaseStyle = DEFAULT_BASE_STYLE): string {
  return `/r/styles/base-${style}/${name}.json`;
}
