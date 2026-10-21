import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from 'shadcn/schema';
import { appPath, nativewindGlobalCss, serializeCss } from './sources';

const SOURCES_PATH = join(__dirname, '../../dist/src');
const REGISTRY_PATH = join(__dirname, '../../registry.json');
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Registry;

describe('appPath', () => {
  it('puts a ui item under components/ui, where the ui alias points', () => {
    expect(appPath({ path: 'registry/ui/button.tsx', type: 'registry:ui' })).toBe('components/ui/button.tsx');
  });

  it('keeps a composed component in its category folder under components', () => {
    expect(appPath({ path: 'registry/components/data-entry/password-input.tsx', type: 'registry:component' })).toBe(
      'components/data-entry/password-input.tsx',
    );
  });

  it('puts a lib file under lib, where the lib alias points', () => {
    expect(appPath({ path: 'registry/lib/utils.ts', type: 'registry:lib' })).toBe('lib/utils.ts');
  });

  it("puts a file with a ~/ target at that path from the app's root", () => {
    expect(appPath({ path: 'registry/theme/zui-theme.css', type: 'registry:file', target: '~/zui-theme.css' })).toBe(
      'zui-theme.css',
    );
  });

  it('throws on a path outside ui, components and lib with no target', () => {
    expect(() => appPath({ path: 'registry/hooks/use-x.ts', type: 'registry:hook' })).toThrow(
      'No app path for registry/hooks/use-x.ts',
    );
  });
});

describe('serializeCss', () => {
  it('writes each nested at-rule and selector as a block, and each string as a declaration', () => {
    const css = serializeCss({
      '@layer base': {
        ':root': { '--radius': '0.625rem' },
        '@media (prefers-color-scheme: dark)': { ':root': { '--background': '10 10 10' } },
      },
    });

    expect(css).toBe(
      [
        '@layer base {',
        '  :root {',
        '    --radius: 0.625rem;',
        '  }',
        '  @media (prefers-color-scheme: dark) {',
        '    :root {',
        '      --background: 10 10 10;',
        '    }',
        '  }',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('writes a key with an empty object as a statement, such as an import', () => {
    expect(serializeCss({ '@import "./zui-theme.css"': {} })).toBe('@import "./zui-theme.css";\n');
  });
});

describe('nativewindGlobalCss', () => {
  it("opens with NativeWind's three Tailwind directives, then the theme's rules", () => {
    const css = nativewindGlobalCss({ '@layer base': { ':root': { '--radius': '0.625rem' } } });

    expect(css).toBe(
      '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --radius: 0.625rem;\n  }\n}\n',
    );
  });
});

describe('the emitted app sources', () => {
  it.each(['vega', 'nova'])('hold every item file of nativewind-%s at the path an app imports it from', (style) => {
    const files = registry.items.flatMap((item) => item.files ?? []);

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const path = appPath({ ...file, path: file.path.replace(/^src\//, '') });
      expect(existsSync(join(SOURCES_PATH, `nativewind-${style}`, path))).toBe(true);
    }
  });

  it("draw Button's default size at Vega's and Nova's own heights, importing through @/", () => {
    const button = (style: string): string =>
      readFileSync(join(SOURCES_PATH, `nativewind-${style}`, 'components/ui/button.tsx'), 'utf8');

    expect(button('vega')).toContain("'h-9 gap-1.5 px-2.5'");
    expect(button('nova')).toContain("'h-8 gap-1.5 px-2.5'");
    expect(button('vega')).toContain("from '@/lib/utils'");
  });

  it("give NativeWind the theme's global.css and Tailwind theme, and Uniwind its zui-theme.css", () => {
    const nativewind = join(SOURCES_PATH, 'nativewind-vega');
    const theme = JSON.parse(readFileSync(join(nativewind, 'tailwind-theme.json'), 'utf8')) as {
      extend: { fontFamily: Record<string, string[]> };
    };

    expect(readFileSync(join(nativewind, 'global.css'), 'utf8')).toContain('@media (prefers-color-scheme: dark)');
    expect(theme.extend.fontFamily.sans).toEqual(['Geist_400Regular']);
    expect(existsSync(join(SOURCES_PATH, 'uniwind-vega', 'zui-theme.css'))).toBe(true);
  });
});
