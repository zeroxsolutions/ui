/**
 * Lays a registry's emitted sources out as an app holds them after `shadcn add`, so an app can import
 * them through its `@/` alias without installing them, as the native preview does.
 */

/** A registry file, its path under the temporary registry such as `registry/ui/button.tsx`. */
export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

/** The folder under `@/` each folder of `src/registry` lands in, per the docs' `components.json`. */
const APP_FOLDERS: ReadonlyMap<string, string> = new Map([
  ['ui', 'components/ui'],
  ['components', 'components'],
  ['lib', 'lib'],
  ['hooks', 'hooks'],
]);

/**
 * The path of `file` from an app's root, such as `components/ui/button.tsx` for
 * `registry/ui/button.tsx`. A `~/` target is taken as written.
 * @throws {Error} `No app path for <path>` for a file outside `ui`, `components`, `lib` and `hooks` with no
 * `~/` target
 */
export function appPath(file: RegistryFile): string {
  if (file.target?.startsWith('~/')) return file.target.slice(2);
  const [, folder, ...rest] = file.path.split('/');
  const appFolder = APP_FOLDERS.get(folder ?? '');
  if (appFolder === undefined || rest.length === 0) {
    throw new Error(`No app path for ${file.path}`);
  }
  return [appFolder, ...rest].join('/');
}

/** A registry item's `css`: a string is a declaration, an empty object a statement, any other a block. */
export interface CssTree {
  [key: string]: string | CssTree;
}

/** Writes `tree` as a stylesheet, two spaces per level, ending in a newline. */
export function serializeCss(tree: CssTree): string {
  const lines = (node: CssTree, depth: number): string[] => {
    const indent = '  '.repeat(depth);
    return Object.entries(node).flatMap(([key, value]) => {
      if (typeof value === 'string') return [`${indent}${key}: ${value};`];
      if (Object.keys(value).length === 0) return [`${indent}${key};`];
      return [`${indent}${key} {`, ...lines(value, depth + 1), `${indent}}`];
    });
  };
  return `${lines(tree, 0).join('\n')}\n`;
}

/** The `global.css` of an app set up by NativeWind's guide once the theme item's `css` is added to it. */
export function nativewindGlobalCss(themeCss: CssTree): string {
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${serializeCss(themeCss)}`;
}
