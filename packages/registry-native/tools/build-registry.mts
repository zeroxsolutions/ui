/**
 * Writes one shadcn registry per engine in Vega, to `dist/r/styles/<engine>-vega/`, from the
 * engine-neutral `registry.json` and sources. Each engine's sources are emitted into a temporary
 * registry, which `shadcn build` turns into the served JSON and `shadcn registry validate` checks.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Registry, RegistryItem } from 'shadcn/schema';
import { aliasImports, emitSource } from '../src/build/emit.ts';
import { parseSlotMap } from '../src/build/slot-map.ts';
import { STATUS_TOKENS, themeItem, type UpstreamColors } from '../src/build/theme.ts';
import type { Engine } from '../src/build/translate.ts';

const PROJECT = resolve(import.meta.dirname, '..');
const SOURCE_ROOT = 'src/';
const STYLE = 'vega';

const ENGINE_PACKAGES = {
  nativewind: 'nativewind@^4',
  uniwind: 'uniwind@^1.12.0',
} as const satisfies Record<Engine, string>;

// tailwind-merge 3 knows only Tailwind 4's class names, and NativeWind 4 runs on Tailwind 3.
const PINNED_RANGES = {
  nativewind: { 'tailwind-merge': '^2' },
  uniwind: { 'tailwind-merge': '^3' },
} as const satisfies Record<Engine, Readonly<Record<string, string>>>;

/** The engine's own file, such as `icon.uniwind.tsx`, when the source has one, else the shared file. */
function sourceFor(path: string, engine: Engine): string {
  const engineFile = path.replace(/(\.[jt]sx?)$/, `.${engine}$1`);
  return existsSync(join(PROJECT, engineFile)) ? engineFile : path;
}

function emitItem(
  item: RegistryItem,
  engine: Engine,
  slots: ReturnType<typeof parseSlotMap>,
  registryRoot: string,
): RegistryItem {
  const pins: Readonly<Record<string, string>> = PINNED_RANGES[engine];
  let importsEngine = false;
  const files = (item.files ?? []).map((file) => {
    const sourcePath = sourceFor(file.path, engine);
    const registryPath = file.path.slice(SOURCE_ROOT.length);
    const pathUnderRegistry = registryPath.replace(/^registry\//, '');
    const source = readFileSync(join(PROJECT, sourcePath), 'utf8');
    const emitted = aliasImports(emitSource(source, slots, engine, sourcePath), pathUnderRegistry);
    importsEngine ||= emitted.includes(`from '${engine}'`);

    const target = join(registryRoot, registryPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, emitted);
    return { ...file, path: registryPath };
  });

  const dependencies = (item.dependencies ?? []).map((name) => (pins[name] ? `${name}@${pins[name]}` : name));
  if (importsEngine) dependencies.push(ENGINE_PACKAGES[engine]);
  return { ...item, ...(dependencies.length > 0 ? { dependencies } : {}), files };
}

/**
 * Lays the generated theme over the `theme` entry of `registry.json`, writing each file it generates
 * into the temporary registry for `shadcn build` to read.
 */
function withTheme(item: RegistryItem, theme: RegistryItem, registryRoot: string): RegistryItem {
  const generated = (theme.files ?? []).map(({ content = '', ...file }) => {
    const target = join(registryRoot, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    return file;
  });
  return { ...item, ...theme, files: [...(item.files ?? []), ...generated] };
}

function buildEngine(
  engine: Engine,
  registry: Registry,
  slots: ReturnType<typeof parseSlotMap>,
  colors: UpstreamColors,
): void {
  const registryRoot = mkdtempSync(join(tmpdir(), `zui-${engine}-${STYLE}-`));
  try {
    const items = registry.items.map((item) => {
      const emitted = emitItem(item, engine, slots, registryRoot);
      return item.name === 'theme'
        ? withTheme(emitted, themeItem(colors, STATUS_TOKENS, engine), registryRoot)
        : emitted;
    });
    writeFileSync(join(registryRoot, 'registry.json'), `${JSON.stringify({ ...registry, items }, null, 2)}\n`);

    const output = join(PROJECT, 'dist/r/styles', `${engine}-${STYLE}`);
    execFileSync('shadcn', ['build', '-o', output], { cwd: registryRoot, stdio: 'inherit' });
    execFileSync('shadcn', ['registry', 'validate'], { cwd: registryRoot, stdio: 'inherit' });
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
  }
}

function main(): void {
  const registry = JSON.parse(readFileSync(join(PROJECT, 'registry.json'), 'utf8')) as Registry;
  const slots = parseSlotMap(readFileSync(join(PROJECT, `styles/upstream/style-${STYLE}.css`), 'utf8'));
  const colors = JSON.parse(
    readFileSync(join(PROJECT, 'styles/upstream/colors-neutral.json'), 'utf8'),
  ) as UpstreamColors;

  rmSync(join(PROJECT, 'dist/r'), { recursive: true, force: true });
  for (const engine of Object.keys(ENGINE_PACKAGES) as Engine[]) {
    buildEngine(engine, registry, slots, colors);
  }
}

main();
