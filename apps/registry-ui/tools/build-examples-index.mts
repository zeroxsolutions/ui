/**
 * Writes the docs' demo index from `examples/` and `registry.json`: every demo and every published
 * component and block, by name. `examples/__index__.tsx` maps a name to its file path, which
 * `ComponentSource` reads at build; `examples/__components__.tsx` maps it to a lazy import of the
 * component the file exports, which `ComponentPreview` renders. They are two files because the
 * components use hooks and carry no client directive, so only a client module may import them,
 * while the paths are read on the server.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '..');
const EXAMPLES = 'registry/bases/base-ui/examples';
const HEADER = '// Written by tools/build-examples-index.mts from examples/ and registry.json.';

interface RegistryItem {
  name: string;
  type: string;
  files: { path: string }[];
}

const demos = readdirSync(join(APP, EXAMPLES))
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx') && !file.startsWith('__'))
  .map((file) => ({ name: file.slice(0, -'.tsx'.length), filePath: `${EXAMPLES}/${file}` }));

// A registry:example item is one of the demo files above, under the same name.
const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as { items: RegistryItem[] };
const published = items
  .filter((item) => item.type !== 'registry:example')
  .map((item) => ({ name: item.name, filePath: item.files[0].path }));

const entries = [...demos, ...published].sort((a, b) => a.name.localeCompare(b.name));
const duplicate = entries.find((entry, i) => entries[i + 1]?.name === entry.name);
if (duplicate) throw new Error(`examples index: "${duplicate.name}" names both a demo and a registry item`);

writeFileSync(
  join(APP, EXAMPLES, '__index__.tsx'),
  `${HEADER}
interface IndexEntry {
  name: string;
  filePath: string;
}

export const Index: Record<string, IndexEntry> = {
${entries.map(({ name, filePath }) => `  '${name}': { name: '${name}', filePath: '${filePath}' },`).join('\n')}
};
`,
);

writeFileSync(
  join(APP, EXAMPLES, '__components__.tsx'),
  `${HEADER}
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

function firstComponent(module: Record<string, unknown>): { default: ComponentType } {
  return { default: Object.values(module).find((value) => typeof value === 'function') as ComponentType };
}

export const Components: Record<string, LazyExoticComponent<ComponentType>> = {
${entries
  .map(
    ({ name, filePath }) =>
      `  '${name}': lazy(() => import('@/${filePath.replace(/\.tsx$/, '')}').then(firstComponent)),`,
  )
  .join('\n')}
};
`,
);

console.log(`examples index: ${demos.length} demos, ${published.length} registry items`);
