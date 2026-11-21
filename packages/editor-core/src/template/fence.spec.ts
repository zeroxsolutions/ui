// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const templateRoot = join(root, 'template');
const allowedPackages = ['zod', 'get-east-asian-width'];

const importPattern = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

function importsOf(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...code.matchAll(importPattern)].map((match) => match[1] ?? match[2] ?? match[3] ?? '');
}

function fenceViolations(file: string, specifiers: string[]): string[] {
  return specifiers.filter((specifier) => {
    if (specifier.startsWith('.')) {
      const target = resolve(dirname(file), specifier);
      return target !== templateRoot && !target.startsWith(templateRoot + sep);
    }
    if (specifier.startsWith('@/') || specifier.startsWith('node:')) return true;
    return !allowedPackages.some((name) => specifier === name || specifier.startsWith(`${name}/`));
  });
}

function shippedFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return shippedFiles(path);
    const isCode = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs'].some((extension) => entry.name.endsWith(extension));
    const shipped = isCode && !/\.(spec|fixture)\./.test(entry.name);
    return shipped ? [path] : [];
  });
}

describe('the template fence', () => {
  it('refuses an engine import', () => {
    expect(fenceViolations(join(root, 'template/index.ts'), ['@tiptap/core'])).toEqual(['@tiptap/core']);
  });

  it('refuses a relative path out of the folder', () => {
    expect(fenceViolations(join(root, 'template/index.ts'), ['../document/core/index.js'])).toEqual([
      '../document/core/index.js',
    ]);
    expect(fenceViolations(join(root, 'template/email/blocks/list.ts'), ['../../variables/interpolate.js'])).toEqual(
      [],
    );
  });

  it('refuses the alias and node modules', () => {
    expect(fenceViolations(join(root, 'template/index.ts'), ['@/document/core/index.js', 'node:fs'])).toEqual([
      '@/document/core/index.js',
      'node:fs',
    ]);
  });

  it('allows zod and the width table', () => {
    expect(fenceViolations(join(root, 'template/index.ts'), ['zod', 'zod/v4', 'get-east-asian-width'])).toEqual([]);
  });

  it('reads every kind of import', () => {
    const source = [
      "import { a } from './a.js';",
      "import type { B } from '../b.js';",
      "export { c } from 'zod';",
      "import './side-effect.js';",
      "const d = await import('./d.js');",
    ].join('\n');
    expect(importsOf(source)).toEqual(['./a.js', '../b.js', 'zod', './side-effect.js', './d.js']);
  });

  it('holds for every shipped template file', () => {
    const files = shippedFiles(templateRoot);
    expect(files.length).toBeGreaterThan(0);
    const violations = files.flatMap((file) =>
      fenceViolations(file, importsOf(readFileSync(file, 'utf8'))).map(
        (specifier) => `${file.slice(root.length + 1)} imports ${specifier}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});
