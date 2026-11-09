import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { createStyleMap, transformStyle } from 'shadcn/utils';

/** The base styles the web registry is built in, as upstream names them. */
export const STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const;

export type Style = (typeof STYLES)[number];

/** Where zui's own sheets live, from the package root. */
export const ZUI_SHEETS = 'registry/styles';

/**
 * `style`'s two sheets, upstream's and zui's, as text. `root` is this package's directory; every path is
 * resolved from it, because the docs app bundles this module away from where it sits.
 */
export function styleSheets(root: string, style: Style): { upstream: string; zui: string } {
  const upstream = createRequire(join(root, 'package.json')).resolve(
    `@zeroxsolutions/shadcn-upstream/snapshot/style-${style}.css`,
  );
  return {
    upstream: readFileSync(upstream, 'utf8'),
    zui: readFileSync(join(root, ZUI_SHEETS, `style-${style}.css`), 'utf8'),
  };
}

/** Each `cn-` slot `style` draws, upstream's and zui's, with the classes it draws it with. */
export function styleMapOf(root: string, style: Style): Record<string, string> {
  const { upstream, zui } = styleSheets(root, style);
  return createStyleMap(`${upstream}\n${zui}`);
}

/**
 * `source` with each `cn-` slot written in a `className`, a `cn()` or a `cva()` replaced by the classes
 * `styleMap` draws it with, which is what `shadcn add` writes for a project in that style. A slot written
 * anywhere else is left as it is.
 */
export function styleSource(source: string, styleMap: Record<string, string>): Promise<string> {
  return transformStyle(source, { styleMap });
}
