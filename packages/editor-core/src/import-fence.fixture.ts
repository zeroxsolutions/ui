import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

/** What a folder of this package may import. */
export interface ImportFence {
  /** Absolute folders a relative import may land in. */
  folders: string[];
  /** Absolute files outside those folders that a relative import may still name. */
  files?: string[];
  /** Bare package names, each allowing its subpaths too. */
  packages: string[];
}

/** The `src/` folder of this package, which every fence's paths are read against. */
export const SRC = resolve(import.meta.dirname);

// A side-effect import opens a statement, so a string that merely ends in `import` is not read as one.
const IMPORT_PATTERN =
  /\bfrom\s*['"]([^'"]+)['"]|(?:^|[;}])\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;

function importsOf(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...code.matchAll(IMPORT_PATTERN)].map((match) => match[1] ?? match[2] ?? match[3] ?? '');
}

function refused(fence: ImportFence, file: string, specifier: string): boolean {
  if (specifier.startsWith('.')) {
    const target = resolve(dirname(file), specifier);
    if (fence.files?.includes(target)) return false;
    return !fence.folders.some((folder) => target === folder || target.startsWith(folder + sep));
  }
  if (specifier.startsWith('@/') || specifier.startsWith('node:')) return true;
  return !fence.packages.some((name) => specifier === name || specifier.startsWith(`${name}/`));
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

/**
 * Every import a shipped file under `dir` makes that `fence` refuses, as `<path> imports <specifier>` with
 * the path relative to `src/`. Throws when `dir` holds no shipped file, so a moved folder cannot pass empty.
 */
export function fenceBreaches(dir: string, fence: ImportFence): string[] {
  const files = shippedFiles(dir);
  if (files.length === 0) throw new Error(`${dir} holds no shipped file`);
  return files.flatMap((file) =>
    importsOf(readFileSync(file, 'utf8'))
      .filter((specifier) => refused(fence, file, specifier))
      .map((specifier) => `${file.slice(SRC.length + 1)} imports ${specifier}`),
  );
}
