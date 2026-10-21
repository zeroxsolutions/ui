/**
 * Writes one shadcn registry per engine and style, to `dist/r/styles/<engine>-<style>/`, from the
 * engine-neutral `registry.json` and sources. Each registry's sources are emitted into a temporary
 * registry, which `shadcn build` turns into the served JSON and `shadcn registry validate` checks.
 * The same sources, and the files the theme item writes, also go to `dist/src/<engine>-<style>/` laid
 * out as an app holds them after `shadcn add`, for the native preview to import through `@/`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Registry, RegistryItem } from 'shadcn/schema';
import { aliasImports, emitSource, type UpstreamStyle } from '../src/build/emit.ts';
import { appPath, nativewindGlobalCss, type CssTree } from '../src/build/sources.ts';
import { parseSlotMap, type SlotMap } from '../src/build/slot-map.ts';
import {
  STATUS_TOKENS,
  parseRadiusScale,
  themeItem,
  themeRadius,
  type RadiusScale,
  type UpstreamColors,
} from '../src/build/theme.ts';
import type { Engine } from '../src/build/translate.ts';

const PROJECT = resolve(import.meta.dirname, '..');
const SOURCE_ROOT = 'src/';
/** Each upstream style the registries are built in, read from `styles/upstream/style-<style>.css`. */
const STYLES = ['vega', 'nova'] as const;
type Style = (typeof STYLES)[number];

const ENGINES = ['nativewind', 'uniwind'] as const satisfies readonly Engine[];
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

// tailwind-merge 3 knows only Tailwind 4's class names, and NativeWind 4 runs on Tailwind 3.
const PINNED_RANGES = {
  nativewind: { 'tailwind-merge': '^2' },
  uniwind: { 'tailwind-merge': '^3' },
} as const satisfies Record<Engine, Readonly<Record<string, string>>>;

/**
 * The range an item that imports `engine` declares it at: from the exact version this package's
 * devDependencies pin, which the specs and the install check ran against, up to its next major.
 * @throws {Error} `<engine> is not pinned to an exact version in devDependencies` otherwise
 */
function engineRange(engine: Engine, devDependencies: Readonly<Record<string, string>>): string {
  const version = devDependencies[engine];
  if (version === undefined || !EXACT_VERSION.test(version)) {
    throw new Error(`${engine} is not pinned to an exact version in devDependencies`);
  }
  return `${engine}@^${version}`;
}

/** The engine's own file, such as `icon.uniwind.tsx`, when the source has one, else the shared file. */
function sourceFor(path: string, engine: Engine): string {
  const engineFile = path.replace(/(\.[jt]sx?)$/, `.${engine}$1`);
  return existsSync(join(PROJECT, engineFile)) ? engineFile : path;
}

/** The style the registry's sources are emitted in, and the slots of the styles beside it. */
interface StyleSlots extends UpstreamStyle {
  otherStyles: readonly SlotMap[];
}

/** Writes `content` to `path`, making its folders. */
function writeFileWithFolders(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/**
 * @param enginePackage - the dependency an item whose emitted source imports `engine` declares, from
 * {@link engineRange}
 * @param radius - the theme's `--radius` for `engine`, which a slot's radius less a length is computed from
 * @param sourcesRoot - the app-shaped folder each emitted file is also written to, at its {@link appPath}
 */
function emitItem(
  item: RegistryItem,
  engine: Engine,
  enginePackage: string,
  style: StyleSlots,
  radius: string,
  registryRoot: string,
  sourcesRoot: string,
): RegistryItem {
  const pins: Readonly<Record<string, string>> = PINNED_RANGES[engine];
  let importsEngine = false;
  const files = (item.files ?? []).map((file) => {
    const sourcePath = sourceFor(file.path, engine);
    const registryPath = file.path.slice(SOURCE_ROOT.length);
    const pathUnderRegistry = registryPath.replace(/^registry\//, '');
    const source = readFileSync(join(PROJECT, sourcePath), 'utf8');
    const emitted = aliasImports(
      emitSource(source, style, engine, sourcePath, style.otherStyles, radius),
      pathUnderRegistry,
    );
    importsEngine ||= emitted.includes(`from '${engine}'`);

    writeFileWithFolders(join(registryRoot, registryPath), emitted);
    writeFileWithFolders(join(sourcesRoot, appPath({ ...file, path: registryPath })), emitted);
    return { ...file, path: registryPath };
  });

  const dependencies = (item.dependencies ?? []).map((name) => (pins[name] ? `${name}@${pins[name]}` : name));
  if (importsEngine) dependencies.push(enginePackage);
  return { ...item, ...(dependencies.length > 0 ? { dependencies } : {}), files };
}

/**
 * Lays the generated theme over the `theme` entry of `registry.json`, writing each file it generates
 * into the temporary registry for `shadcn build` to read, and into `sourcesRoot` where an app holds it.
 * NativeWind's theme writes no file of its own but changes the app's `global.css` and Tailwind config,
 * so `sourcesRoot` gets that `global.css` and the config's `theme` as `tailwind-theme.json`.
 */
function withTheme(
  item: RegistryItem,
  theme: RegistryItem,
  engine: Engine,
  registryRoot: string,
  sourcesRoot: string,
): RegistryItem {
  const generated = (theme.files ?? []).map(({ content = '', ...file }) => {
    writeFileWithFolders(join(registryRoot, file.path), content);
    writeFileWithFolders(join(sourcesRoot, appPath(file)), content);
    return file;
  });
  if (engine === 'nativewind') {
    writeFileWithFolders(join(sourcesRoot, 'global.css'), nativewindGlobalCss((theme.css ?? {}) as CssTree));
    const tailwindTheme: unknown = theme.tailwind?.config?.theme ?? {};
    writeFileWithFolders(join(sourcesRoot, 'tailwind-theme.json'), `${JSON.stringify(tailwindTheme, null, 2)}\n`);
  }
  return { ...item, ...theme, files: [...(item.files ?? []), ...generated] };
}

/**
 * Builds and validates the registry of `engine` in `styleName` into `dist/r/styles/<engine>-<style>/`,
 * and writes its sources to `dist/src/<engine>-<style>/`.
 * Every style takes the same theme, from the neutral colours and the site's radius scale, since no
 * style sheet defines a token of its own.
 */
function buildRegistry(
  engine: Engine,
  enginePackage: string,
  styleName: Style,
  style: StyleSlots,
  registry: Registry,
  colors: UpstreamColors,
  radii: RadiusScale,
): void {
  const registryRoot = mkdtempSync(join(tmpdir(), `zui-${engine}-${styleName}-`));
  const sourcesRoot = join(PROJECT, 'dist/src', `${engine}-${styleName}`);
  try {
    const items = registry.items.map((item) => {
      const emitted = emitItem(
        item,
        engine,
        enginePackage,
        style,
        themeRadius(colors, engine),
        registryRoot,
        sourcesRoot,
      );
      return item.name === 'theme'
        ? withTheme(emitted, themeItem(colors, radii, STATUS_TOKENS, engine), engine, registryRoot, sourcesRoot)
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
  const { devDependencies } = JSON.parse(readFileSync(join(PROJECT, 'package.json'), 'utf8')) as {
    devDependencies: Record<string, string>;
  };
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
  rmSync(join(PROJECT, 'dist/src'), { recursive: true, force: true });
  for (const [styleName, slots] of slotsByStyle) {
    const otherStyles = [...slotsByStyle].flatMap(([other, otherSlots]) => (other === styleName ? [] : [otherSlots]));
    for (const engine of ENGINES) {
      buildRegistry(
        engine,
        engineRange(engine, devDependencies),
        styleName,
        { name: styleName, slots, otherStyles },
        registry,
        colors,
        radii,
      );
    }
  }
}

main();
