import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { aliasImports, emitSource } from './emit';
import { parseSlotMap } from './slot-map';
import { translateClasses, type Engine } from './translate';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-vega.css');
const STYLES_PATH = join(__dirname, '../../dist/r/styles');
const ENGINES = ['nativewind', 'uniwind'] as const satisfies readonly Engine[];
const OTHER_ENGINE_PACKAGE = {
  nativewind: /uniwind/i,
  uniwind: /nativewind|react-native-css-interop/i,
} as const satisfies Record<Engine, RegExp>;
const TAILWIND_MERGE = {
  nativewind: 'tailwind-merge@^2',
  uniwind: 'tailwind-merge@^3',
} as const satisfies Record<Engine, string>;

const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));

function viewClasses(slot: string, engine: Engine): string[] {
  return translateClasses(slots.get(slot) ?? [], engine, 'view').classes;
}

describe('emitSource', () => {
  it.each(ENGINES)("replaces each view token with its slot's classes for %s", (engine) => {
    const emitted = emitSource("cva('cn-button cn-button-variant-default')", slots, engine, 'button.tsx');

    const classes = [...viewClasses('cn-button', engine), ...viewClasses('cn-button-variant-default', engine)];
    expect(emitted).toBe(`cva('${classes.join(' ')}')`);
  });

  it('replaces a text token with the slot classes a label takes', () => {
    const emitted = emitSource("cva('cn-button-variant-default/text')", slots, 'uniwind', 'button.tsx');

    expect(emitted).toBe("cva('text-primary-foreground')");
  });

  it("gives Button's default size Vega's height for both engines", () => {
    for (const engine of ENGINES) {
      expect(emitSource("'cn-button-size-default'", slots, engine, 'button.tsx')).toBe("'h-9 gap-1.5 px-2.5'");
    }
  });

  it('renames a Tailwind 4 step to its Tailwind 3 name for nativewind only', () => {
    expect(emitSource("'cn-button-variant-outline'", slots, 'nativewind', 'button.tsx')).toContain('shadow-sm');
    expect(emitSource("'cn-button-variant-outline'", slots, 'uniwind', 'button.tsx')).toContain('shadow-xs');
  });

  it('removes a token whose translation is empty, with its space', () => {
    const emitted = emitSource(
      "['flex-row cn-button-size-icon/text', 'cn-button-size-icon/text']",
      slots,
      'uniwind',
      'button.tsx',
    );

    expect(emitted).toBe("['flex-row', '']");
  });

  it('leaves a string literal with no token as it was', () => {
    const source = "const a = 'items-center  justify-center';";

    expect(emitSource(source, slots, 'uniwind', 'button.tsx')).toBe(source);
  });

  it('drops a line comment run that describes the tokens', () => {
    const source = [
      '// A `cn-<slot>` token stands for a slot,',
      '// replaced by the build.',
      "const a = 'cn-button-size-icon';",
    ].join('\n');

    expect(emitSource(source, slots, 'uniwind', 'button.tsx')).toBe("const a = 'size-9';");
  });

  it('throws on a slot Vega does not declare, naming the file', () => {
    expect(() => emitSource("'cn-buton'", slots, 'uniwind', 'button.tsx')).toThrow(
      'Unknown slot cn-buton in button.tsx',
    );
  });

  it('throws when a slot holds a class with no rule', () => {
    const custom = new Map([['cn-thing', ['sm:h-9']]]);

    expect(() => emitSource("'cn-thing'", custom, 'nativewind', 'thing.tsx')).toThrow(
      'Untranslated sm:h-9 in cn-thing',
    );
  });

  it('throws when a token is left outside a quoted string', () => {
    expect(() => emitSource('const a = `cn-button`;', slots, 'uniwind', 'button.tsx')).toThrow(
      'Unreplaced cn-button in button.tsx',
    );
  });
});

describe('aliasImports', () => {
  it("points a ui file's relative imports at the consumer's aliases", () => {
    const source = "import { cn } from '../lib/utils';\nimport { Text } from './text';";

    expect(aliasImports(source, 'ui/button.tsx')).toBe(
      "import { cn } from '@/lib/utils';\nimport { Text } from '@/components/ui/text';",
    );
  });

  it('leaves a package import alone', () => {
    const source = "import { Pressable } from 'react-native';";

    expect(aliasImports(source, 'ui/button.tsx')).toBe(source);
  });

  it('throws on a relative import outside ui and lib', () => {
    expect(() => aliasImports("import x from '../hooks/x';", 'ui/button.tsx')).toThrow(
      'No alias for ../hooks/x in ui/button.tsx',
    );
  });
});

interface BuiltItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; content: string }[];
}

const PLATFORM_PACKAGES: ReadonlySet<string> = new Set(['react', 'react-native']);
const IMPORT_SPECIFIER = /from '([^']+)'/g;
const ALIASED_ITEM = /^@\/(?:components\/ui|lib)\/(.+)$/;

function packageName(specifier: string): string {
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

function withoutRange(dependency: string): string {
  const at = dependency.lastIndexOf('@');
  return at > 0 ? dependency.slice(0, at) : dependency;
}

describe.each(ENGINES)('the built %s-vega registry', (engine) => {
  const directory = join(STYLES_PATH, `${engine}-vega`);
  const index = JSON.parse(readFileSync(join(directory, 'registry.json'), 'utf8')) as {
    name: string;
    items: { name: string }[];
  };
  const itemNames = index.items.map((item) => item.name);
  const files = readdirSync(directory).filter((file) => file !== 'registry.json');
  const items = files.map((file) => JSON.parse(readFileSync(join(directory, file), 'utf8')) as BuiltItem);
  const item = (name: string): BuiltItem | undefined => items.find((built) => built.name === name);

  it('is named zui and lists utils, text, icon and button', () => {
    expect(index.name).toBe('zui');
    expect([...itemNames].sort()).toEqual(['button', 'icon', 'text', 'utils']);
    expect(files.sort()).toEqual(['button.json', 'icon.json', 'text.json', 'utils.json']);
  });

  it("holds no slot token, web class or the other engine's package", () => {
    for (const file of files) {
      const json = readFileSync(join(directory, file), 'utf8');
      expect({ file, slotToken: json.includes('cn-'), web: json.includes('web:') }).toEqual({
        file,
        slotToken: false,
        web: false,
      });
      expect(json).not.toMatch(OTHER_ENGINE_PACKAGE[engine]);
    }
  });

  it('resolves every @zui dependency to an item of the same registry', () => {
    const dependencies = items.flatMap((built) => built.registryDependencies ?? []);

    expect(dependencies.length).toBeGreaterThan(0);
    for (const dependency of dependencies) {
      expect(dependency).toMatch(/^@zui\//);
      expect(itemNames).toContain(dependency.replace(/^@zui\//, ''));
    }
  });

  it('covers every import of every file with a dependency or another item', () => {
    for (const built of items) {
      const packages = (built.dependencies ?? []).map(withoutRange);
      for (const file of built.files) {
        for (const [, specifier] of file.content.matchAll(IMPORT_SPECIFIER)) {
          const aliased = ALIASED_ITEM.exec(specifier);
          if (aliased) {
            expect({ file: file.path, needs: `@zui/${aliased[1]}` }).toEqual({
              file: file.path,
              needs: built.registryDependencies?.find((dependency) => dependency === `@zui/${aliased[1]}`),
            });
          } else if (!PLATFORM_PACKAGES.has(specifier)) {
            expect(packages).toContain(packageName(specifier));
          }
        }
      }
    }
  });

  it("pins tailwind-merge to the major of the engine's Tailwind", () => {
    expect(item('utils')?.dependencies).toContain(TAILWIND_MERGE[engine]);
  });

  it("ships the engine's icon as icon.tsx", () => {
    const [file] = item('icon')?.files ?? [];

    expect(file.path).toMatch(/\/ui\/icon\.tsx$/);
    expect(file.content).toContain(`from '${engine}'`);
  });

  it('gives Button size="default" the h-9 height', () => {
    const [file] = item('button')?.files ?? [];

    expect(file.content).toMatch(/size: \{\s*default: '[^']*\bh-9\b/);
  });

  it("gives Button Vega's pressed nudge", () => {
    const [file] = item('button')?.files ?? [];

    expect(file.content).toContain('active:translate-y-px');
  });
});

describe('the built nativewind-vega registry', () => {
  it('carries no Tailwind 4 class name that Tailwind 3 lacks', () => {
    const directory = join(STYLES_PATH, 'nativewind-vega');
    for (const file of readdirSync(directory)) {
      expect(readFileSync(join(directory, file), 'utf8')).not.toMatch(/\b(shadow-xs|rounded-xs|outline-hidden)\b/);
    }
  });
});
