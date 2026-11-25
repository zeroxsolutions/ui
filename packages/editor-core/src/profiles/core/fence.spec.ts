// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const coreRoot = join(root, 'profiles/core');
// The block library imports none of the profiles, which its own fence holds, so reading it here makes no cycle.
const allowedFolders = [coreRoot, join(root, 'blocks'), join(root, 'template'), join(root, 'document/core/types')];
// The profile throws EditorError; the file holds plain error classes and imports nothing.
const allowedFiles = [join(root, 'document/core/errors.js')];
const allowedPackages = ['zod'];

const importPattern = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

function importsOf(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...code.matchAll(importPattern)].map((match) => match[1] ?? match[2] ?? match[3] ?? '');
}

function fenceViolations(file: string, specifiers: string[]): string[] {
  return specifiers.filter((specifier) => {
    if (specifier.startsWith('.')) {
      const target = resolve(dirname(file), specifier);
      if (allowedFiles.includes(target)) return false;
      return !allowedFolders.some((folder) => target === folder || target.startsWith(folder + sep));
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

describe('the profile core fence', () => {
  it('refuses the engine, its escape and React', () => {
    const file = join(coreRoot, 'index.ts');
    expect(fenceViolations(file, ['@tiptap/core', '@tiptap/pm/state', '../../document/advanced.js', 'react'])).toEqual([
      '@tiptap/core',
      '@tiptap/pm/state',
      '../../document/advanced.js',
      'react',
    ]);
  });

  it('refuses the rest of the document area and the editor entry', () => {
    const file = join(coreRoot, 'index.ts');
    expect(
      fenceViolations(file, ['../../document/core/index.js', '../editor/index.js', '../../composer/index.js']),
    ).toEqual(['../../document/core/index.js', '../editor/index.js', '../../composer/index.js']);
  });

  it('allows the core, the block library, the template, the document types, the errors and zod', () => {
    const file = join(coreRoot, 'profile.ts');
    expect(
      fenceViolations(file, [
        './types.js',
        '../../blocks/preset.js',
        '../../template/email/index.js',
        '../../document/core/types/index.js',
        '../../document/core/errors.js',
        'zod',
      ]),
    ).toEqual([]);
  });

  it('refuses the alias and node modules', () => {
    expect(fenceViolations(join(coreRoot, 'index.ts'), ['@/template/index.js', 'node:fs'])).toEqual([
      '@/template/index.js',
      'node:fs',
    ]);
  });

  it('holds for every shipped profile core file', () => {
    const files = shippedFiles(coreRoot);
    expect(files.length).toBeGreaterThan(0);
    const violations = files.flatMap((file) =>
      fenceViolations(file, importsOf(readFileSync(file, 'utf8'))).map(
        (specifier) => `${file.slice(root.length + 1)} imports ${specifier}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});
