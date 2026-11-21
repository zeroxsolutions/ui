import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const SKIPPED = new Set(['node_modules', 'dist', '.next', 'out-tsc', 'test-output']);

/** The entries a consumer may import: an area's index, the unstable engine escape, and the manifest. */
const ALLOWED = /^@zeroxsolutions\/editor-core\/(?:(?:[a-z-]+\/)*index|document\/advanced|package\.json)$/;

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (SKIPPED.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.(ts|tsx|mdx)$/.test(entry.name) ? [path] : [];
  });
}

describe('how the docs import editor-core', () => {
  it('imports only an area index, document/advanced or package.json', () => {
    const refused = ['content', 'src'].flatMap((folder) =>
      files(join(ROOT, folder)).flatMap((file) =>
        [...readFileSync(file, 'utf8').matchAll(/['"](@zeroxsolutions\/editor-core\/[^'"]*)['"]/g)]
          .map(([, specifier]) => specifier)
          .filter((specifier) => !ALLOWED.test(specifier))
          .map((specifier) => `${relative(ROOT, file)}: ${specifier}`),
      ),
    );
    expect(refused).toEqual([]);
  });
});
