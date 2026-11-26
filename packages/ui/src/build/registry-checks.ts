import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

/**
 * The checks `registry.spec.ts` runs over `registry.json`: each answers the problems it finds as lines naming the
 * item, an empty list meaning none.
 */

/** A file an item publishes: its path under the package, its registry type and where the CLI writes it. */
export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

/** A rule's declarations, or an at-rule's nested rules, as an item's `css` keys them. */
export interface CssBlock {
  [key: string]: string | CssBlock;
}

/** The custom properties an item installs, under `@theme`, `:root` and `.dark`. */
export type CssVars = Record<'theme' | 'light' | 'dark', Record<string, string>>;

/** An item as `registry.json` lists it. */
export interface RegistryItem {
  name: string;
  type: string;
  categories?: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  cssVars?: CssVars;
  /** CSS the item ships, keyed by selector or at-rule (`@utility <name>`), each a map of declarations or of nested rules. */
  css?: CssBlock;
  files: RegistryFile[];
}

/** What an item's files import, as its three declaration fields spell it; a file reads `<path> (<type>)`. */
interface Declaration {
  files: string[];
  registryDependencies: string[];
  dependencies: string[];
}

/** The folder every published source sits under, relative to the package root. */
export const BASE = 'registry/bases/base-ui';
/** The namespace a house item is named by in another item's `registryDependencies`. */
export const ITEM_PREFIX = '@zui/';

const FROM_IMPORT = /^\s*(?:import|export)\s+(type\s+)?[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/gm;
const BARE_IMPORT = /^\s*import\s*['"]([^'"]+)['"]/gm;
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
/** A `css` key importing a package's stylesheet (`@import 'katex/dist/katex.min.css'`), its specifier captured; a path or a URL is no package. */
const CSS_PACKAGE_IMPORT = /^@import\s+['"](?![./]|[a-z]+:)([^'"]+)['"]/;
const SHIPPED = /^registry\/bases\/base-ui\/(lib|hooks|types)\//;
const TOKEN_CLASS = /\b(?:bg|text|border|ring|fill|stroke)-(success|warning)(?![\w-])/g;
/** A hue variable an item's `css` draws with, such as `var(--hue-red-surface)`, its name captured. */
const HUE_VARIABLE = /var\(--(hue-[a-z]+(?:-surface)?)\)/g;
const FAMILY = /^registry\/bases\/base-ui\/(?:components\/([^/]+)|(blocks))\/([^/]+)\.tsx$/;
const PUBLISHED = ['registry:component', 'registry:block'];
/** A document editor feature's own folder, which its item's first file sits in; the `features/index.ts` barrel is none. */
const FEATURE = /^registry\/bases\/base-ui\/editor\/document\/features\/[^/]+\//;
/** A file under icons/<set>/ is an animated icon this registry owns, published as the item `<set>-<file name>`. */
export const HOUSE_ICON = /^registry\/bases\/base-ui\/icons\/([a-z0-9-]+)\/([^/]+)\.tsx$/;

/** The checks over the registry package rooted at `root`, whose `registry/bases/base-ui/` they read the sources of. */
export function registryChecks(root: string) {
  /** The specifiers a source file imports; a type-only import of a package is left out, since nothing installs for it. */
  function importsOf(path: string): string[] {
    const source = readFileSync(join(root, path), 'utf8');
    return [
      ...[...source.matchAll(FROM_IMPORT)]
        .filter(([, typeOnly, specifier]) => !typeOnly || specifier.startsWith('@/') || specifier.startsWith('.'))
        .map(([, , specifier]) => specifier),
      ...[...source.matchAll(BARE_IMPORT)].map(([, specifier]) => specifier),
      ...[...source.matchAll(DYNAMIC_IMPORT)].map(([, specifier]) => specifier),
    ];
  }

  /** The app-relative file a specifier names, or undefined for a package; a relative `.js` specifier is refused, since Turbopack resolves none. */
  function sourceOf(importer: string, specifier: string): string | undefined {
    let stem: string;
    if (specifier.startsWith('@/registry/')) stem = specifier.slice('@/'.length);
    else if (specifier.startsWith('.')) {
      if (specifier.endsWith('.js')) {
        throw new Error(`${importer} imports ${specifier}, which Turbopack cannot resolve; drop the .js`);
      }
      stem = join(dirname(importer), specifier);
    } else if (specifier.startsWith('@/')) throw new Error(`${importer} imports ${specifier}, which is app code`);
    else return undefined;
    const found = ['.ts', '.tsx', '/index.ts', '/index.tsx']
      .map((ext) => stem + ext)
      .find((p) => existsSync(join(root, p)));
    if (found === undefined) throw new Error(`${importer} imports ${specifier}, which resolves to no file`);
    return found;
  }

  /** The upstream item a vendored file is, or undefined for a file this registry owns. */
  function upstreamOf(source: string): string | undefined {
    const part = /^registry\/bases\/base-ui\/ui\/([^/]+)\.tsx?$/.exec(source);
    if (part) return `@shadcn/${part[1]}`;
    if (source === `${BASE}/lib/utils.ts`) return '@shadcn/utils';
    if (source === `${BASE}/hooks/use-mobile.ts`) return '@shadcn/use-mobile';
    return undefined;
  }

  function packageOf(specifier: string): string {
    return specifier
      .split('/')
      .slice(0, specifier.startsWith('@') ? 2 : 1)
      .join('/');
  }

  /** The package a `dependencies` entry installs: `<name>@<range>` pins the range the item needs. */
  function dependencyName(entry: string): string {
    const at = entry.indexOf('@', 1);
    return at === -1 ? entry : entry.slice(0, at);
  }

  /** Each component or block file an item ships, mapped to that item's name. */
  function ownersOf(items: RegistryItem[]): Map<string, string> {
    return new Map(
      items.flatMap((item) =>
        item.files
          .filter(
            (file) =>
              file.path.startsWith(`${BASE}/components/`) ||
              file.path.startsWith(`${BASE}/blocks/`) ||
              file.path.startsWith(`${BASE}/editor/`) ||
              HOUSE_ICON.test(file.path),
          )
          .map((file) => [file.path, item.name] as const),
      ),
    );
  }

  /**
   * What the item has to declare for `shadcn add` to write files that compile: its own files (every one
   * outside lib/, hooks/ and types/), the lib/, hooks/ and types/ files they reach, the upstream item for a
   * vendored file, another item's `@zui/` name for a file that item ships, and the package for a bare import
   * or for a stylesheet its `css` imports, which the consumer's own stylesheet has to resolve. A document editor
   * feature also names `document-editor` even where no file imports it, since a feature plugs into that editor and
   * does nothing without it.
   */
  function expectedDeclaration(item: RegistryItem, owners: ReadonlyMap<string, string>): Declaration {
    const roots = item.files.filter((file) => !SHIPPED.test(file.path));
    const files = new Set(roots.map((file) => `${file.path} (${file.type})`));
    const registryDependencies = new Set<string>();
    const dependencies = new Set<string>();
    const seen = new Set(roots.map((file) => file.path));
    const pending = [...seen];
    for (let importer = pending.pop(); importer !== undefined; importer = pending.pop()) {
      for (const specifier of importsOf(importer)) {
        const source = sourceOf(importer, specifier);
        const upstream = source === undefined ? undefined : upstreamOf(source);
        if (source === undefined) {
          const name = packageOf(specifier);
          if (name !== 'react' && name !== 'react-dom') dependencies.add(name);
        } else if (upstream !== undefined) {
          registryDependencies.add(upstream);
        } else if (SHIPPED.test(source)) {
          if (!seen.has(source)) {
            seen.add(source);
            pending.push(source);
            files.add(`${source} (${source.startsWith(`${BASE}/hooks/`) ? 'registry:hook' : 'registry:lib'})`);
          }
        } else {
          const owner = owners.get(source);
          if (owner === undefined) throw new Error(`${importer} imports ${specifier}, which no registry item ships`);
          if (owner !== item.name) registryDependencies.add(`${ITEM_PREFIX}${owner}`);
        }
      }
    }
    if (FEATURE.test(item.files[0]?.path ?? '')) registryDependencies.add(`${ITEM_PREFIX}document-editor`);
    for (const key of Object.keys(item.css ?? {})) {
      const specifier = CSS_PACKAGE_IMPORT.exec(key)?.[1];
      if (specifier !== undefined) dependencies.add(packageOf(specifier));
    }
    const sorted = (values: Set<string>): string[] => [...values].sort();
    return {
      files: sorted(files),
      registryDependencies: sorted(registryDependencies),
      dependencies: sorted(dependencies),
    };
  }

  function declarationProblems(item: RegistryItem, owners: ReadonlyMap<string, string>): string[] {
    let expected: Declaration;
    try {
      expected = expectedDeclaration(item, owners);
    } catch (error) {
      return [`${item.name}: ${(error as Error).message}`];
    }
    const declared: Declaration = {
      files: item.files.map((file) => `${file.path} (${file.type})`),
      registryDependencies: item.registryDependencies ?? [],
      dependencies: (item.dependencies ?? []).map(dependencyName),
    };
    return (['files', 'registryDependencies', 'dependencies'] as const).flatMap((field) => [
      ...expected[field]
        .filter((value) => !declared[field].includes(value))
        .map((value) => `${item.name}: ${field} lacks ${value}`),
      ...declared[field]
        .filter((value) => !expected[field].includes(value))
        .map((value) => `${item.name}: ${field} declares ${value}, which its files do not import`),
    ]);
  }

  /** A custom property's value inside one top-level block of the base stylesheet. */
  function themeValue(selector: ':root' | '.dark', token: string): string {
    const css = readFileSync(join(root, BASE, 'styles.css'), 'utf8');
    const block = new RegExp(`^${selector.replace('.', '\\.')} \\{\\n([\\s\\S]*?)^\\}`, 'm').exec(css)?.[1] ?? '';
    const value = new RegExp(`^\\s*--${token}:\\s*([^;]+);`, 'm').exec(block)?.[1];
    if (value === undefined) throw new Error(`styles.css declares no --${token} under ${selector}`);
    return value;
  }

  function cssVarsProblems(item: RegistryItem): string[] {
    const tokens = [
      ...new Set([
        ...item.files.flatMap((file) =>
          [...readFileSync(join(root, file.path), 'utf8').matchAll(TOKEN_CLASS)].map(([, token]) => token),
        ),
        // A hue is the base theme's too; an item whose rules draw with one ships its light and dark values.
        ...[...JSON.stringify(item.css ?? {}).matchAll(HUE_VARIABLE)].map(([, token]) => token),
      ]),
    ].sort();
    if (tokens.length === 0) {
      return item.cssVars ? [`${item.name}: carries cssVars but paints with neither success nor warning`] : [];
    }
    if (!item.cssVars) return [`${item.name}: paints with ${tokens.join(' and ')} but carries no cssVars`];
    const expected: CssVars = {
      theme: Object.fromEntries(tokens.map((token) => [`color-${token}`, `var(--${token})`])),
      light: Object.fromEntries(tokens.map((token) => [token, themeValue(':root', token)])),
      dark: Object.fromEntries(tokens.map((token) => [token, themeValue('.dark', token)])),
    };
    return isDeepStrictEqual(item.cssVars, expected)
      ? []
      : [`${item.name}: cssVars should be ${JSON.stringify(expected)}`];
  }

  /** A block of a stylesheet: its declarations, its statement at-rules, and the blocks nested in it, by prelude. */
  interface SheetBlock {
    declarations: Record<string, string>;
    statements: Set<string>;
    blocks: Map<string, SheetBlock>;
  }

  /** A prelude on one line, so a selector list written across lines reads as an item's `css` key spells it. */
  function oneLine(prelude: string): string {
    return prelude
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .trim();
  }

  /** One statement of a block: an at-rule (`@plugin "..."`) joins its statements, any other is a declaration. */
  function addStatement(block: SheetBlock, text: string): void {
    const statement = text.trim();
    if (statement === '') return;
    if (statement.startsWith('@')) {
      block.statements.add(oneLine(statement));
      return;
    }
    const colon = statement.indexOf(':');
    block.declarations[statement.slice(0, colon).trim()] = statement
      .slice(colon + 1)
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** A stylesheet's comments dropped and its rules read into nested blocks; a quoted string is read whole. */
  function parseSheet(css: string): SheetBlock {
    const block = (): SheetBlock => ({ declarations: {}, statements: new Set(), blocks: new Map() });
    const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const stack = [block()];
    let text = '';
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      const current = stack[stack.length - 1];
      if (char === '"' || char === "'") {
        const end = source.indexOf(char, i + 1);
        text += source.slice(i, end + 1);
        i = end;
      } else if (char === '{') {
        const prelude = oneLine(text);
        const nested = current.blocks.get(prelude) ?? block();
        current.blocks.set(prelude, nested);
        stack.push(nested);
        text = '';
      } else if (char === ';' || char === '}') {
        addStatement(current, text);
        text = '';
        if (char === '}') stack.pop();
      } else {
        text += char;
      }
    }
    return stack[0];
  }

  /** The base stylesheet and the editor's, which the site renders with and an item's `css` is checked against. */
  function sheets(): SheetBlock[] {
    return ['styles.css', 'editor/styles.css'].map((sheet) =>
      parseSheet(readFileSync(join(root, BASE, sheet), 'utf8')),
    );
  }

  /**
   * Each entry of `shipped` against the blocks it nests in: a map of declarations is a rule with exactly the
   * sheet's declarations, or with none a statement at-rule (`@plugin "..."`) the sheet holds; a map of maps is
   * an at-rule (`@layer components`) whose rules are checked inside the sheet's block of that name.
   */
  function cssBlockProblems(name: string, shipped: CssBlock, scopes: SheetBlock[], outer: string[]): string[] {
    return Object.entries(shipped).flatMap(([rule, body]) => {
      const label = ruleLabel(outer, rule);
      if (typeof body === 'string') return [`${name}: css ${label} is a declaration outside a rule`];
      const found = scopes.map((scope) => scope.blocks.get(rule)).find((block) => block !== undefined);
      const nested = Object.values(body).some((value) => typeof value !== 'string');
      if (nested) {
        if (found === undefined) return [`${name}: css ships ${label}, which styles.css does not declare`];
        return cssBlockProblems(name, body, [found], [...outer, rule]);
      }
      const expected = found?.declarations ?? (scopes.some((scope) => scope.statements.has(rule)) ? {} : undefined);
      if (expected === undefined) return [`${name}: css ships ${label}, which styles.css does not declare`];
      return isDeepStrictEqual(body, expected) ? [] : [`${name}: css ${label} should be ${JSON.stringify(expected)}`];
    });
  }

  /** Each rule an item's `css` ships is the same rule, with the same declarations, as the stylesheet the site renders with. */
  function cssProblems(item: RegistryItem): string[] {
    return cssBlockProblems(item.name, item.css ?? {}, sheets(), []);
  }

  /** A rule as `cssProblems` labels it: the at-rules it nests in wrapped around it, `@layer components { .x }`. */
  function ruleLabel(outer: string[], rule: string): string {
    return outer.reduceRight((inner, at) => `${at} { ${inner} }`, rule);
  }

  /** Each rule and statement at-rule of a parsed sheet, by label; a block holding blocks is an at-rule wrapping them. */
  function sheetRules(block: SheetBlock, outer: string[] = []): string[] {
    return [
      ...[...block.statements].map((statement) => ruleLabel(outer, statement)),
      ...[...block.blocks].flatMap(([prelude, nested]) =>
        nested.blocks.size > 0 ? sheetRules(nested, [...outer, prelude]) : [ruleLabel(outer, prelude)],
      ),
    ];
  }

  /** Each rule and statement at-rule an item's `css` ships, by label, read as `cssBlockProblems` reads it. */
  function shippedRules(css: CssBlock, outer: string[] = []): string[] {
    return Object.entries(css).flatMap(([rule, body]) => {
      if (typeof body === 'string') return [];
      return Object.values(body).some((value) => typeof value !== 'string')
        ? shippedRules(body, [...outer, rule])
        : [ruleLabel(outer, rule)];
    });
  }

  /**
   * The editor sheet's rules that ship in some number of editor items other than one: the dark variant, which the
   * base sheet already declares for every consumer, and the KaTeX import, which the spec gives to both items that
   * typeset math.
   */
  const SHARED_EDITOR_RULES: ReadonlyMap<string, readonly string[]> = new Map([
    ['@custom-variant dark (&:is(.dark *))', []],
    ["@import 'katex/dist/katex.min.css'", ['editor-math', 'math-editor']],
  ]);

  /** Each rule of the editor sheet ships in the `css` of exactly one editor item, or of the items `SHARED_EDITOR_RULES` names. */
  function editorCssProblems(items: RegistryItem[], sheet: string): string[] {
    const editorItems = items.filter((item) => item.files.some((file) => file.path.startsWith(`${BASE}/editor/`)));
    return sheetRules(parseSheet(sheet)).flatMap((rule) => {
      const owners = editorItems
        .filter((item) => shippedRules(item.css ?? {}).includes(rule))
        .map((item) => item.name)
        .sort();
      const shared = SHARED_EDITOR_RULES.get(rule);
      if (shared !== undefined) {
        return isDeepStrictEqual(owners, shared) ? [] : [`${rule}: should ship in ${JSON.stringify(shared)}`];
      }
      if (owners.length === 1) return [];
      return owners.length === 0 ? [`${rule}: ships in no editor item`] : [`${rule}: ships in ${owners.join(' and ')}`];
    });
  }

  /** Every family file: a component under a kind folder or a block, specs left out. The blocks folder may not exist. */
  function familyFiles(): string[] {
    return ['components', 'blocks']
      .filter((dir) => existsSync(join(root, BASE, dir)))
      .flatMap((dir) =>
        readdirSync(join(root, BASE, dir), { recursive: true, encoding: 'utf8' }).map(
          (path) => `${BASE}/${dir}/${path}`,
        ),
      )
      .filter((path) => FAMILY.test(path) && !path.endsWith('.spec.tsx'))
      .sort();
  }

  /**
   * Each family file is the first file of exactly one component or block item, which takes its name and kind
   * folder, or else ships as a later file of exactly one such item, as a part only that item publishes. An item
   * of editor files answers to `editorProblems` instead.
   */
  function familyProblems(items: RegistryItem[], families: string[]): string[] {
    const published = items.filter(
      (item) => PUBLISHED.includes(item.type) && !(item.files[0]?.path ?? '').startsWith(`${BASE}/editor/`),
    );
    const unowned = families.flatMap((family) => {
      const owners = published.filter((item) => item.files[0]?.path === family).map((item) => item.name);
      if (owners.length === 0) {
        const carriers = published.filter((item) => item.files.slice(1).some((file) => file.path === family));
        if (carriers.length === 1) return [];
        return carriers.length === 0
          ? [`${family}: is the first file of no item`]
          : [`${family}: is a part of ${carriers.map((item) => item.name).join(' and ')}`];
      }
      return owners.length === 1 ? [] : [`${family}: is the first file of ${owners.join(' and ')}`];
    });
    const misnamed = published.flatMap((item) => {
      const path = item.files[0]?.path ?? '';
      const match = families.includes(path) ? FAMILY.exec(path) : null;
      if (match === null) return [`${item.name}: first file ${path} is not a family file`];
      const [, kind, blocks, name] = match;
      const categories = [kind ?? blocks];
      return [
        ...(item.name === name ? [] : [`${item.name}: name should be ${name}`]),
        ...(isDeepStrictEqual(item.categories, categories)
          ? []
          : [`${item.name}: categories should be ${JSON.stringify(categories)}`]),
      ];
    });
    return [...unowned, ...misnamed];
  }

  /** Every editor file: a non-spec `.ts` or `.tsx` under `editor/`. */
  function editorFiles(): string[] {
    return readdirSync(join(root, BASE, 'editor'), { recursive: true, encoding: 'utf8' })
      .filter((path) => /\.tsx?$/.test(path) && !/\.spec\.tsx?$/.test(path))
      .map((path) => `${BASE}/editor/${path}`)
      .sort();
  }

  /** Each editor file ships in exactly one editor item, and every editor item is in the editor category. */
  function editorProblems(items: RegistryItem[], files: string[]): string[] {
    const prefix = `${BASE}/editor/`;
    const editorItems = items.filter((item) => item.files.some((file) => file.path.startsWith(prefix)));
    const unowned = files.flatMap((path) => {
      const owners = editorItems.filter((item) => item.files.some((file) => file.path === path));
      if (owners.length === 1) return [];
      return owners.length === 0
        ? [`${path}: ships in no editor item`]
        : [`${path}: ships in ${owners.map((item) => item.name).join(' and ')}`];
    });
    const misdeclared = editorItems.flatMap((item) =>
      isDeepStrictEqual(item.categories, ['editor']) ? [] : [`${item.name}: category should be editor`],
    );
    return [...unowned, ...misdeclared];
  }

  /**
   * Where a published file lands, as a target the shadcn CLI resolves through the consumer's `components.json`
   * aliases: a component, editor file, icon or demo under `@components/`, a hook under `@hooks/`, a lib or type
   * file under `@lib/`. A plain target is read from the project root, so it lands in `components/` whatever the
   * consumer's `components` alias names; a component with none keeps only what follows a folder named like that
   * alias's last segment, so `@/shared/widgets` drops its kind folder. Nothing of ours targets `@ui/`, which holds
   * shadcn's own primitives.
   * @returns the target, or undefined for a file under a folder no rule places yet
   */
  function aliasTarget(path: string): string | undefined {
    if (!path.startsWith(`${BASE}/`)) return undefined;
    const [folder, ...below] = path.slice(`${BASE}/`.length).split('/');
    const name = below.join('/');
    if (name === '') return undefined;
    if (folder === 'components') return `@components/${name}`;
    if (folder === 'editor') return `@components/editor/${name}`;
    if (folder === 'icons') return `@components/general/${name}`;
    if (folder === 'examples' && below.length === 1) return `@components/${name}`;
    if (folder === 'hooks' && below.length === 1) return `@hooks/${name}`;
    if ((folder === 'lib' || folder === 'types') && below.length === 1) return `@lib/${name}`;
    return undefined;
  }

  /** Each published file whose target is not the one {@link aliasTarget} gives its path. */
  function targetProblems(items: RegistryItem[]): string[] {
    return items.flatMap((item) =>
      item.files.flatMap((file) => {
        const expected = aliasTarget(file.path);
        if (expected === undefined) return [`${item.name}: ${file.path} is in no folder with an alias target`];
        return file.target === expected
          ? []
          : [`${item.name}: ${file.path} should target ${expected}, not ${file.target}`];
      }),
    );
  }

  /**
   * Whether some published item owns the example: its `<name>-demo`, or a further `<name>-<state>`
   * example for a state the demo itself never reaches.
   */
  function hasOwner(example: RegistryItem, names: string[]): boolean {
    return names.some((name) => example.name === `${name}-demo` || example.name.startsWith(`${name}-`));
  }

  /**
   * Each component or block item has exactly one `<name>-demo` example; every example is that demo or a
   * further `<name>-<state>` example of the same item, for a state the demo never reaches.
   */
  function demoProblems(items: RegistryItem[]): string[] {
    const names = items.filter((item) => PUBLISHED.includes(item.type)).map((item) => item.name);
    const examples = items.filter((item) => item.type === 'registry:example');
    return [
      ...names.flatMap((name) => {
        const count = examples.filter((example) => example.name === `${name}-demo`).length;
        if (count === 0) return [`${name}: has no ${name}-demo example`];
        return count === 1 ? [] : [`${name}: has ${count} ${name}-demo examples`];
      }),
      ...examples
        .filter((example) => !hasOwner(example, names))
        .map((example) => `${example.name}: is the demo of no item`),
      ...examples.flatMap((example) => {
        const expected = { path: `${BASE}/examples/${example.name}.tsx`, type: 'registry:example' };
        const first = example.files[0];
        return isDeepStrictEqual({ path: first?.path, type: first?.type }, expected)
          ? []
          : [`${example.name}: files[0] should be ${JSON.stringify(expected)}`];
      }),
    ];
  }

  return {
    sourceOf,
    ownersOf,
    declarationProblems,
    cssVarsProblems,
    cssProblems,
    editorCssProblems,
    familyFiles,
    familyProblems,
    editorFiles,
    editorProblems,
    targetProblems,
    demoProblems,
  };
}
