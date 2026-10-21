/**
 * Writes one shadcn registry per engine and style, to `dist/r/styles/<engine>-<style>/`, from the
 * engine-neutral `registry.json` and sources. Each registry's sources are emitted into a temporary
 * registry, which `shadcn build` turns into the served JSON and `shadcn registry validate` checks.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Registry, RegistryItem } from 'shadcn/schema';
import { aliasImports, emitSource } from '../src/build/emit.ts';
import { parseSlotMap, type SlotMap } from '../src/build/slot-map.ts';
import {
  STATUS_TOKENS,
  parseRadiusScale,
  themeItem,
  type RadiusScale,
  type UpstreamColors,
} from '../src/build/theme.ts';
import type { Engine } from '../src/build/translate.ts';

const PROJECT = resolve(import.meta.dirname, '..');
const SOURCE_ROOT = 'src/';
/** Each upstream style the registries are built in, read from `styles/upstream/style-<style>.css`. */
const STYLES = ['vega', 'nova'] as const;
type Style = (typeof STYLES)[number];

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

/** The slots the registry's sources are emitted against, and those of the styles beside it. */
interface StyleSlots {
  slots: SlotMap;
  otherStyles: readonly SlotMap[];
}

function emitItem(item: RegistryItem, engine: Engine, style: StyleSlots, registryRoot: string): RegistryItem {
  const pins: Readonly<Record<string, string>> = PINNED_RANGES[engine];
  let importsEngine = false;
  const files = (item.files ?? []).map((file) => {
    const sourcePath = sourceFor(file.path, engine);
    const registryPath = file.path.slice(SOURCE_ROOT.length);
    const pathUnderRegistry = registryPath.replace(/^registry\//, '');
    const source = readFileSync(join(PROJECT, sourcePath), 'utf8');
    const emitted = aliasImports(
      emitSource(source, style.slots, engine, sourcePath, style.otherStyles),
      pathUnderRegistry,
    );
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

/**
 * Builds and validates the registry of `engine` in `styleName` into `dist/r/styles/<engine>-<style>/`.
 * Every style takes the same theme, from the neutral colours and the site's radius scale, since no
 * style sheet defines a token of its own.
 */
function buildRegistry(
  engine: Engine,
  styleName: Style,
  style: StyleSlots,
  registry: Registry,
  colors: UpstreamColors,
  radii: RadiusScale,
): void {
  const registryRoot = mkdtempSync(join(tmpdir(), `zui-${engine}-${styleName}-`));
  try {
    const items = registry.items.map((item) => {
      const emitted = emitItem(item, engine, style, registryRoot);
      return item.name === 'theme'
        ? withTheme(emitted, themeItem(colors, radii, STATUS_TOKENS, engine), registryRoot)
        : emitted;
    });
    writeFileSync(join(registryRoot, 'registry.json'), `${JSON.stringify({ ...registry, items }, null, 2)}\n`);

    const output = join(PROJECT, 'dist/r/styles', `${engine}-${styleName}`);
    execFileSync('shadcn', ['build', '-o', output], { cwd: registryRoot, stdio: 'inherit' });
    execFileSync('shadcn', ['registry', 'validate'], { cwd: registryRoot, stdio: 'inherit' });
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
  }
}

function main(): void {
  const registry = JSON.parse(readFileSync(join(PROJECT, 'registry.json'), 'utf8')) as Registry;
  const slotsByStyle = new Map(
    STYLES.map((style) => [
      style,
      parseSlotMap(readFileSync(join(PROJECT, `styles/upstream/style-${style}.css`), 'utf8')),
    ]),
  );
  const colors = JSON.parse(
    readFileSync(join(PROJECT, 'styles/upstream/colors-neutral.json'), 'utf8'),
  ) as UpstreamColors;
  const radii = parseRadiusScale(readFileSync(join(PROJECT, 'styles/upstream/globals.css'), 'utf8'));

  rmSync(join(PROJECT, 'dist/r'), { recursive: true, force: true });
  for (const [styleName, slots] of slotsByStyle) {
    const otherStyles = [...slotsByStyle].flatMap(([other, otherSlots]) => (other === styleName ? [] : [otherSlots]));
    for (const engine of Object.keys(ENGINE_PACKAGES) as Engine[]) {
      buildRegistry(engine, styleName, { slots, otherStyles }, registry, colors, radii);
    }
  }
}

main();
