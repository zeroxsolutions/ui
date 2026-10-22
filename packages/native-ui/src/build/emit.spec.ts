import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { aliasImports, emitSource, type UpstreamStyle } from './emit';
import { parseSlotMap } from './slot-map';
import { translateClasses, type Engine } from './translate';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-vega.css');
const NOVA_SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-nova.css');
const STYLES_PATH = join(__dirname, '../../dist/r/styles');
const REGISTRY_PATH = join(__dirname, '../../registry.json');
const ENGINES = ['nativewind', 'uniwind'] as const satisfies readonly Engine[];
const OTHER_ENGINE_PACKAGE = {
  nativewind: /uniwind/i,
  uniwind: /nativewind|react-native-css-interop/i,
} as const satisfies Record<Engine, RegExp>;
const TAILWIND_MERGE = {
  nativewind: 'tailwind-merge@^2',
  uniwind: 'tailwind-merge@^3',
} as const satisfies Record<Engine, string>;

/** The engine version each install check app ran, and so the lowest the icon item may declare. */
const INSTALL_CHECKED_ENGINE = {
  nativewind: 'nativewind@^4.2.7',
  uniwind: 'uniwind@^1.13.0',
} as const satisfies Record<Engine, string>;

const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));
const novaSlots = parseSlotMap(readFileSync(NOVA_SNAPSHOT_PATH, 'utf8'));
const vega: UpstreamStyle = { name: 'vega', slots };
const nova: UpstreamStyle = { name: 'nova', slots: novaSlots };

function viewClasses(slot: string, engine: Engine): string[] {
  return translateClasses(slots.get(slot) ?? [], engine, 'view').classes;
}

describe('emitSource', () => {
  it.each(ENGINES)("replaces each view token with its slot's classes for %s", (engine) => {
    const emitted = emitSource("cva('cn-button cn-button-variant-default')", vega, engine, 'button.tsx');

    const classes = [...viewClasses('cn-button', engine), ...viewClasses('cn-button-variant-default', engine)];
    expect(emitted).toBe(`cva('${classes.join(' ')}')`);
  });

  it('replaces a text token with the slot classes a label takes', () => {
    const emitted = emitSource("cva('cn-button-variant-default/text')", vega, 'uniwind', 'button.tsx');

    expect(emitted).toBe("cva('text-primary-foreground')");
  });

  it("gives Button's default size Vega's height for both engines", () => {
    for (const engine of ENGINES) {
      expect(emitSource("'cn-button-size-default'", vega, engine, 'button.tsx')).toBe("'h-9 gap-1.5 px-2.5'");
    }
  });

  it("gives Button's default size Nova's own height for both engines", () => {
    for (const engine of ENGINES) {
      expect(emitSource("'cn-button-size-default'", nova, engine, 'button.tsx')).toBe("'h-8 gap-1.5 px-2.5'");
    }
  });

  it("spaces Card by the steps the emitted style's own Card slot defines", () => {
    expect(emitSource("'cn-card-header@size=sm'", vega, 'uniwind', 'card.tsx')).toBe("'px-4'");
    expect(emitSource("'cn-card-header@size=sm'", nova, 'uniwind', 'card.tsx')).toBe("'px-3'");
  });

  it('renames a Tailwind 4 step to its Tailwind 3 name for nativewind only', () => {
    expect(emitSource("'cn-button-variant-outline'", vega, 'nativewind', 'button.tsx')).toContain('shadow-sm');
    expect(emitSource("'cn-button-variant-outline'", vega, 'uniwind', 'button.tsx')).toContain('shadow-xs');
  });

  it('replaces an icon token with the size the slot gives an icon', () => {
    const emitted = emitSource("cva('cn-button/icon cn-button-size-xs/icon')", vega, 'uniwind', 'button.tsx');

    expect(emitted).toBe("cva('size-4 size-3')");
  });

  it('removes a token whose translation is empty, with its space', () => {
    const emitted = emitSource(
      "['flex-row cn-button-size-icon/text', 'cn-button-size-icon/text']",
      vega,
      'uniwind',
      'button.tsx',
    );

    expect(emitted).toBe("['flex-row', '']");
  });

  it('leaves a string literal with no token as it was', () => {
    const source = "const a = 'items-center  justify-center';";

    expect(emitSource(source, vega, 'uniwind', 'button.tsx')).toBe(source);
  });

  it('drops a line comment run that describes the tokens', () => {
    const source = [
      '// A `cn-<slot>` token stands for a slot,',
      '// replaced by the build.',
      "const a = 'cn-button-size-icon';",
    ].join('\n');

    expect(emitSource(source, vega, 'uniwind', 'button.tsx')).toBe("const a = 'size-9';");
  });

  it('throws on a slot Vega does not declare, naming the file and the registry', () => {
    expect(() => emitSource("'cn-buton'", vega, 'uniwind', 'button.tsx')).toThrow(
      'Unknown slot cn-buton in button.tsx (uniwind-vega)',
    );
  });

  it('throws when a slot holds a class with no rule, naming the registry', () => {
    const custom = new Map([['cn-thing', ['starting:h-9']]]);

    expect(() => emitSource("'cn-thing'", { name: 'vega', slots: custom }, 'nativewind', 'thing.tsx')).toThrow(
      'Untranslated starting:h-9 in cn-thing (nativewind-vega)',
    );
  });

  it.each(ENGINES)('replaces a state token with the classes Vega puts behind that state for %s', (engine) => {
    const emitted = emitSource("['cn-switch', 'cn-switch@checked']", vega, engine, 'switch.tsx');

    expect(emitted).toBe(`['${viewClasses('cn-switch', engine).join(' ')}', 'bg-primary']`);
  });

  it('replaces a compound state token and a text state token', () => {
    expect(emitSource("'cn-switch-thumb@size=sm+checked'", vega, 'nativewind', 'switch.tsx')).toBe(
      "'translate-x-[10px]'",
    );
    expect(emitSource("'cn-checkbox/text@checked'", vega, 'uniwind', 'checkbox.tsx')).toBe("'text-primary-foreground'");
  });

  it('throws on a state outside the state vocabulary, naming the slot, the file and the registry', () => {
    expect(() => emitSource("'cn-switch@cheked'", vega, 'uniwind', 'switch.tsx')).toThrow(
      'Unknown state cheked for cn-switch in switch.tsx (uniwind-vega)',
    );
  });

  it('throws on a state token whose translation is empty, so a typo cannot ship as nothing', () => {
    expect(() => emitSource("'cn-switch@pressed'", vega, 'uniwind', 'switch.tsx')).toThrow(
      'Empty state pressed for cn-switch in switch.tsx (uniwind-vega)',
    );
    expect(() => emitSource("'cn-switch/text@checked'", vega, 'uniwind', 'switch.tsx')).toThrow(
      'Empty state checked for cn-switch in switch.tsx (uniwind-vega)',
    );
  });

  it('removes a state token another style puts classes behind and this style does not', () => {
    const source = "'cn-toggle-group@spacing=0+variant=outline'";

    expect(emitSource(source, nova, 'uniwind', 'toggle-group.tsx', [slots])).toBe("''");
    expect(emitSource(source, vega, 'uniwind', 'toggle-group.tsx', [novaSlots])).toBe("'shadow-xs'");
  });

  it('throws on a state token no style puts a class behind, so a typo cannot ship as nothing', () => {
    expect(() => emitSource("'cn-switch@pressed'", nova, 'uniwind', 'switch.tsx', [slots])).toThrow(
      'Empty state pressed for cn-switch in switch.tsx (uniwind-nova)',
    );
  });

  it('removes a slot this style lacks and another style declares, as upstream draws nothing for it', () => {
    const other = new Map([['cn-only-elsewhere', ['p-2']]]);

    expect(emitSource("'flex-row cn-only-elsewhere'", vega, 'uniwind', 'thing.tsx', [other])).toBe("'flex-row'");
  });

  it('throws on a slot no style declares, so a typo cannot ship as nothing', () => {
    const other = new Map([['cn-only-elsewhere', ['p-2']]]);

    expect(() => emitSource("'cn-only-elswhere'", vega, 'uniwind', 'thing.tsx', [other])).toThrow(
      'Unknown slot cn-only-elswhere in thing.tsx (uniwind-vega)',
    );
  });

  it('throws when a token is left outside a quoted string', () => {
    expect(() => emitSource('const a = `cn-button`;', vega, 'uniwind', 'button.tsx')).toThrow(
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

  it("points a composed component's relative imports at the consumer's ui and lib aliases", () => {
    const source = "import { cn } from '../../lib/utils';\nimport { Input } from '../../ui/input';";

    expect(aliasImports(source, 'components/data-entry/password-input.tsx')).toBe(
      "import { cn } from '@/lib/utils';\nimport { Input } from '@/components/ui/input';",
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
  type: string;
  categories?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; content: string }[];
}

const PLATFORM_PACKAGES: ReadonlySet<string> = new Set(['react', 'react-native']);
const BARE_WEIGHT = /\bfont-(?:normal|medium|semibold|bold)\b|fontWeight/;
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

const STYLES = ['vega', 'nova'] as const;
const REGISTRIES = STYLES.flatMap((style) =>
  ENGINES.map((engine): [`${Engine}-${(typeof STYLES)[number]}`, Engine, (typeof STYLES)[number]] => [
    `${engine}-${style}`,
    engine,
    style,
  ]),
);

/** What each style gives Button: its default height, its radius, and that radius step in the theme. */
const BUTTON_SHAPE = {
  vega: { height: 'h-9', radius: 'rounded-md', step: 'md', scale: 'calc(var(--radius) * 0.8)' },
  nova: { height: 'h-8', radius: 'rounded-lg', step: 'lg', scale: 'var(--radius)' },
} as const;

describe.each(REGISTRIES)('the built %s registry', (registry, engine, style) => {
  const directory = join(STYLES_PATH, registry);
  const index = JSON.parse(readFileSync(join(directory, 'registry.json'), 'utf8')) as {
    name: string;
    items: { name: string }[];
  };
  const itemNames = index.items.map((item) => item.name);
  const files = readdirSync(directory).filter((file) => file !== 'registry.json');
  const items = files.map((file) => JSON.parse(readFileSync(join(directory, file), 'utf8')) as BuiltItem);
  const item = (name: string): BuiltItem | undefined => items.find((built) => built.name === name);

  it('is named zui and lists every item registry.json declares', () => {
    const declared = (JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { items: { name: string }[] }).items;
    const declaredNames = declared.map((declaredItem) => declaredItem.name).sort();

    expect(index.name).toBe('zui');
    expect([...itemNames].sort()).toEqual(declaredNames);
    expect(files.sort()).toEqual(declaredNames.map((name) => `${name}.json`).sort());
  });

  it("ships theme as a registry:theme item holding the style's background", () => {
    const theme = item('theme');

    expect(theme?.type).toBe('registry:theme');
    expect(JSON.stringify(theme)).toMatch(/--(color-)?background\b/);
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

  it('gives an app the types of the untyped d3 modules the chart parts import', () => {
    expect(item('charts')?.devDependencies).toEqual(['@types/d3-scale', '@types/d3-shape']);
  });

  it("pins tailwind-merge to the major of the engine's Tailwind", () => {
    expect(item('utils')?.dependencies).toContain(TAILWIND_MERGE[engine]);
  });

  it("ships the engine's icon as icon.tsx", () => {
    const icon = item('icon');

    expect(icon).toBeDefined();
    const [file] = icon?.files ?? [];
    expect(file.path).toMatch(/\/ui\/icon\.tsx$/);
    expect(file.content).toContain(`from '${engine}'`);
  });

  it('declares the range of the engine the install check ran the icon against', () => {
    expect(item('icon')?.dependencies).toContain(INSTALL_CHECKED_ENGINE[engine]);
  });

  it('gives Button size="default" the style\'s own height', () => {
    const [file] = item('button')?.files ?? [];

    expect(file.content).toMatch(new RegExp(`size: \\{\\s*default: '[^']*\\b${BUTTON_SHAPE[style].height}\\b`));
  });

  it("gives an icon in Button the style's size-4, and size-3 at xs", () => {
    const [file] = item('button')?.files ?? [];

    expect(file.content).toContain("cva('size-4'");
    expect(file.content).toMatch(/xs: 'size-3'/);
  });

  it("gives Button the style's radius step, which the theme's scale derives from --radius", () => {
    const [file] = item('button')?.files ?? [];
    const theme = JSON.stringify(item('theme'));
    const { radius, step, scale } = BUTTON_SHAPE[style];

    expect(file.content).toMatch(new RegExp(`\\b${radius}\\b`));
    expect(theme).toContain(engine === 'nativewind' ? `"${step}":"${scale}"` : `--radius-${step}: ${scale};`);
  });

  it("spaces Card by the style's own Card spacing", () => {
    const [file] = item('card')?.files ?? [];
    const spacing = style === 'vega' ? ['gap-6', 'py-6'] : ['gap-4', 'py-4'];

    for (const cls of spacing) {
      expect(file.content).toMatch(new RegExp(`\\b${cls}\\b`));
    }
  });

  it("draws Button's label in the medium Geist family", () => {
    const [file] = item('button')?.files ?? [];

    expect(file.content).toContain('font-sans-medium');
  });

  it('names no font weight in any file', () => {
    for (const built of items) {
      expect({ name: built.name, weight: JSON.stringify(built).match(BARE_WEIGHT) }).toEqual({
        name: built.name,
        weight: null,
      });
    }
  });

  it('leaves the theme to setup, so no item depends on it', () => {
    for (const built of items) {
      expect({ name: built.name, theme: built.registryDependencies?.includes('@zui/theme') ?? false }).toEqual({
        name: built.name,
        theme: false,
      });
    }
    expect(item('text')?.registryDependencies).toBeDefined();
    expect(item('button')?.registryDependencies).toBeDefined();
  });

  it('ships fonts.ts as a lib file with no target, so it lands in the lib alias like utils', () => {
    const fonts = item('theme')?.files.find((file) => file.path.endsWith('/fonts.ts'));

    expect(fonts).toMatchObject({ type: 'registry:lib' });
    expect(fonts).not.toHaveProperty('target');
  });

  it('ships fonts.ts in the theme with the packages it imports', () => {
    const theme = item('theme');
    const fonts = theme?.files.find((file) => file.path.endsWith('/fonts.ts'));

    expect(fonts?.content).toContain('Geist_400Regular');
    expect(theme?.dependencies).toEqual(expect.arrayContaining(['expo-font', '@expo-google-fonts/geist']));
  });

  it('ships password-input as a data-entry registry:component under components/, which the CLI keeps below the components alias', () => {
    const passwordInput = item('password-input');

    expect(passwordInput).toMatchObject({ type: 'registry:component', categories: ['data-entry'] });
    expect(passwordInput?.files).toEqual([
      expect.objectContaining({
        path: 'registry/components/data-entry/password-input.tsx',
        type: 'registry:component',
      }),
    ]);
    expect(passwordInput?.files[0]).not.toHaveProperty('target');
    expect(passwordInput?.files[0].content).toContain("from '@/components/ui/input-group'");
  });

  it('ships password-strength as a feedback registry:component under components/', () => {
    const passwordStrength = item('password-strength');

    expect(passwordStrength).toMatchObject({ type: 'registry:component', categories: ['feedback'] });
    expect(passwordStrength?.files).toEqual([
      expect.objectContaining({
        path: 'registry/components/feedback/password-strength.tsx',
        type: 'registry:component',
      }),
    ]);
    expect(passwordStrength?.files[0]).not.toHaveProperty('target');
    expect(passwordStrength?.files[0].content).toContain("from '@/components/ui/progress'");
  });

  it('ships code-input as a data-entry registry:component over input-otp', () => {
    const codeInput = item('code-input');

    expect(codeInput).toMatchObject({
      type: 'registry:component',
      categories: ['data-entry'],
      registryDependencies: ['@zui/input-otp', '@zui/utils'],
    });
    expect(codeInput?.files).toEqual([
      expect.objectContaining({ path: 'registry/components/data-entry/code-input.tsx', type: 'registry:component' }),
    ]);
    expect(codeInput?.files[0].content).toContain("from '@/components/ui/input-otp'");
  });

  it('ships unsaved-changes-toolbar as a feedback registry:component over button and spinner', () => {
    const toolbar = item('unsaved-changes-toolbar');

    expect(toolbar).toMatchObject({ type: 'registry:component', categories: ['feedback'] });
    expect(toolbar?.files).toEqual([
      expect.objectContaining({
        path: 'registry/components/feedback/unsaved-changes-toolbar.tsx',
        type: 'registry:component',
      }),
    ]);
    expect(toolbar?.files[0]).not.toHaveProperty('target');
    expect(toolbar?.files[0].content).toContain("from '@/components/ui/spinner'");
  });

  it('ships tab-bar as a navigation registry:component over badge, icon and text', () => {
    const tabBar = item('tab-bar');

    expect(tabBar).toMatchObject({ type: 'registry:component', categories: ['navigation'] });
    expect(tabBar?.files).toEqual([
      expect.objectContaining({ path: 'registry/components/navigation/tab-bar.tsx', type: 'registry:component' }),
    ]);
    expect(tabBar?.files[0]).not.toHaveProperty('target');
    expect(tabBar?.files[0].content).toContain("from '@/components/ui/badge'");
  });

  it("gives Button the style's pressed nudge", () => {
    const [file] = item('button')?.files ?? [];

    expect(file.content).toContain('active:translate-y-px');
  });
});

describe.each(STYLES)('the built nativewind-%s registry', (style) => {
  it('holds no oklch colour in its theme', () => {
    expect(readFileSync(join(STYLES_PATH, `nativewind-${style}`, 'theme.json'), 'utf8')).not.toContain('oklch(');
  });

  it('carries no Tailwind 4 class name that Tailwind 3 lacks', () => {
    const directory = join(STYLES_PATH, `nativewind-${style}`);
    for (const file of readdirSync(directory)) {
      expect(readFileSync(join(directory, file), 'utf8')).not.toMatch(
        /\b(shadow-xs|shadow-2xs|rounded-xs|outline-hidden|drop-shadow-xs|inset-shadow-[\w-]+|inset-ring-[\w-]+|bg-linear-[\w-]+|field-sizing-[\w-]+|text-shadow-[\w-]+)\b|[\w\]]!(?=[\s'"])/,
      );
    }
  });
});

describe('the built registries of the two styles', () => {
  it('ship the same theme, since Nova and Vega share the neutral colours and the radius scale', () => {
    for (const engine of ENGINES) {
      expect(readFileSync(join(STYLES_PATH, `${engine}-nova`, 'theme.json'), 'utf8')).toBe(
        readFileSync(join(STYLES_PATH, `${engine}-vega`, 'theme.json'), 'utf8'),
      );
    }
  });
});
