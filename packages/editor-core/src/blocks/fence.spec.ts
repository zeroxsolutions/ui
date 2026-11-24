// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const blocksRoot = join(root, 'blocks');
const allowedFolders = [blocksRoot, join(root, 'template'), join(root, 'document/core/types')];
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

describe('the block library fence', () => {
  it('refuses the engine, React, the rest of the document area and the profiles', () => {
    const file = join(blocksRoot, 'index.ts');
    expect(
      fenceViolations(file, [
        '@tiptap/core',
        'react',
        '../document/core/index.js',
        '../document/advanced.js',
        '../profiles/core/index.js',
        '@/template/index.js',
        'node:fs',
      ]),
    ).toEqual([
      '@tiptap/core',
      'react',
      '../document/core/index.js',
      '../document/advanced.js',
      '../profiles/core/index.js',
      '@/template/index.js',
      'node:fs',
    ]);
  });

  it('allows itself, the template, the document types and zod', () => {
    const file = join(blocksRoot, 'define-block.ts');
    expect(
      fenceViolations(file, [
        './document-codec.js',
        '../template/email/index.js',
        '../document/core/types/index.js',
        'zod',
      ]),
    ).toEqual([]);
  });

  it('holds for every shipped block library file', () => {
    const files = shippedFiles(blocksRoot);
    expect(files.length).toBeGreaterThan(0);
    const violations = files.flatMap((file) =>
      fenceViolations(file, importsOf(readFileSync(file, 'utf8'))).map(
        (specifier) => `${file.slice(root.length + 1)} imports ${specifier}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});
