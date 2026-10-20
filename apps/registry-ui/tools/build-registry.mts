/**
 * Builds the registry's JSON once, in nova's directory, and copies it under every other base style. An
 * item's own file is the same under each style; the `@shadcn/*` primitives it names come from shadcn
 * in the consumer's style.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASE_STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const;
// The style the items' own classes are drawn in, which next.config.mjs redirects the old flat paths to.
const DRAWN_IN = 'nova' satisfies (typeof BASE_STYLES)[number];

const APP = resolve(import.meta.dirname, '..');
const OUT = join(APP, 'public/r');

function styleDirectory(style: (typeof BASE_STYLES)[number]): string {
  return join(OUT, 'styles', `base-${style}`);
}

// A file left at the old flat path would be served before the redirect to the styled path.
rmSync(OUT, { recursive: true, force: true });
execFileSync('shadcn', ['build', '-o', styleDirectory(DRAWN_IN)], { cwd: APP, stdio: 'inherit' });
for (const style of BASE_STYLES)
  if (style !== DRAWN_IN) cpSync(styleDirectory(DRAWN_IN), styleDirectory(style), { recursive: true });
execFileSync('shadcn', ['registry', 'validate', 'registry.json'], { cwd: APP, stdio: 'inherit' });
