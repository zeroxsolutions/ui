/**
 * Builds the registry's JSON once, in the default style's directory, and copies it under every other
 * base style. An item's own file is the same under each style; the `@shadcn/*` primitives it names
 * come from shadcn in the consumer's style.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { BASE_STYLES, DEFAULT_BASE_STYLE } from '../src/lib/registry-styles.ts';

const APP = resolve(import.meta.dirname, '..');
const OUT = join(APP, 'public/r');
const styleDir = (style: string) => join(OUT, 'styles', `base-${style}`);

// A file left at the old flat path would be served before the redirect to the styled path.
rmSync(OUT, { recursive: true, force: true });
execFileSync('shadcn', ['build', '-o', styleDir(DEFAULT_BASE_STYLE)], { cwd: APP, stdio: 'inherit' });
for (const style of BASE_STYLES)
  if (style !== DEFAULT_BASE_STYLE) cpSync(styleDir(DEFAULT_BASE_STYLE), styleDir(style), { recursive: true });
execFileSync('shadcn', ['registry', 'validate', 'registry.json'], { cwd: APP, stdio: 'inherit' });
