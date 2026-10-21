import { registryStyle } from '@/lib/style-choice';
import type { NativeEngine } from '@/types/native-engine';
import type { PlatformStyle } from '@/types/platform';

/** The engine and the style a native page shows its install snippets in, and the origin the registry is served from. */
export interface NativeInstallOf {
  engine: NativeEngine;
  style: PlatformStyle<'native'>;
  origin: string;
}

/**
 * The two commands that add the native item `name`: by its `@zui` name, which `components.json` resolves
 * to the style it names, and by its URL in `engine` and `style`, for an app without the `@zui` entry.
 */
export function nativeInstallCommands(name: string, of: NativeInstallOf): { registry: string; url: string } {
  const url = new URL(`r/styles/${registryStyle({ platform: 'native', ...of })}/${name}.json`, of.origin);
  return { registry: `pnpm dlx shadcn@latest add @zui/${name}`, url: `pnpm dlx shadcn@latest add ${url.href}` };
}

/** A native app's `components.json` for `engine` in `style`: NativeWind names its Tailwind 3 config, Uniwind's Tailwind 4 has none. */
export function nativeComponentsJson({ engine, style, origin }: NativeInstallOf): string {
  const json = {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: registryStyle({ platform: 'native', engine, style }),
    rsc: false,
    tsx: true,
    tailwind: {
      config: engine === 'nativewind' ? 'tailwind.config.js' : '',
      css: 'global.css',
      baseColor: 'neutral',
      cssVariables: true,
    },
    aliases: {
      components: '@/components',
      ui: '@/components/ui',
      lib: '@/lib',
      utils: '@/lib/utils',
      hooks: '@/hooks',
    },
    registries: { '@zui': `${origin}/r/styles/{style}/{name}.json` },
  };
  return JSON.stringify(json, null, 2);
}
