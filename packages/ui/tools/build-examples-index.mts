/**
 * Writes the docs' demo index from `examples/` and `registry.json`: every demo and every published
 * component and block, by name. `examples/__index__.tsx` maps a name to the files it ships, first the
 * one whose component it names (a demo is one file; an item lists its whole `files`), which
 * `ComponentSource` and `rehypeDocsCode` read at build, in every zone. The component maps are apart
 * from it because the components use hooks and carry no client directive, so only a client module may
 * import them, while the paths are read on the server. There are two maps, each a lazy import of the
 * component the first file exports, so that an app bundles only the demos it renders:
 * `__components__.tsx` holds every entry outside the editor set; `__editor-components__.tsx` holds the
 * editor set, which the editor docs zone renders. The editor set is an item in the `editor` category
 * and an item that names one among its registry dependencies; `Index` marks each entry's set too, so a
 * server module can tell the two apart without importing either map.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '..');
const EXAMPLES = 'registry/bases/base-ui/examples';
const HEADER = '// Written by tools/build-examples-index.mts from examples/ and registry.json.';

interface RegistryItem {
  name: string;
  type: string;
  categories?: string[];
  registryDependencies?: string[];
  files: { path: string }[];
}

const demos = readdirSync(join(APP, EXAMPLES))
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx') && !file.startsWith('__'))
  .map((file) => ({ name: file.slice(0, -'.tsx'.length), files: [`${EXAMPLES}/${file}`] }));

// A registry:example item is one of the demo files above, under the same name.
const { name: registry, items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
  name: string;
  items: RegistryItem[];
};
const published = items
  .filter((item) => item.type !== 'registry:example')
  .map((item) => ({ name: item.name, files: item.files.map((file) => file.path) }));

const editors = new Set(items.filter((item) => item.categories?.includes('editor')).map((item) => item.name));
const editorSet = new Set(
  items
    .filter(
      (item) =>
        editors.has(item.name) ||
        item.registryDependencies?.some((dependency) => editors.has(dependency.replace(`@${registry}/`, ''))),
    )
    .map((item) => item.name),
);

const entries = [...demos, ...published].sort((a, b) => a.name.localeCompare(b.name));
const duplicate = entries.find((entry, i) => entries[i + 1]?.name === entry.name);
if (duplicate) throw new Error(`examples index: "${duplicate.name}" names both a demo and a registry item`);

writeFileSync(
  join(APP, EXAMPLES, '__index__.tsx'),
  `${HEADER}
interface IndexEntry {
  name: string;
  files: string[];
  /** In the editor set, which the editor docs zone renders rather than registry-ui. */
  editor: boolean;
}

export const Index: Record<string, IndexEntry> = {
${entries.map(({ name, files }) => `  '${name}': { name: '${name}', files: ${JSON.stringify(files)}, editor: ${editorSet.has(name)} },`).join('\n')}
};
`,
);

const loader = ({ files: [file] }: { files: string[] }): string =>
  `() => import('@/${file.replace(/\.tsx?$/, '')}').then(firstComponent)`;

const inEditorSet = entries.filter(({ name }) => editorSet.has(name));
const outsideEditorSet = entries.filter(({ name }) => !editorSet.has(name));

function writeComponents(file: string, exportName: string, group: typeof entries): void {
  const lines = group.map((entry) => `  '${entry.name}': lazy(${loader(entry)}),`);
  writeFileSync(
    join(APP, EXAMPLES, file),
    `${HEADER}
import { lazy, type ComponentType } from 'react';

function firstComponent(module: Record<string, unknown>): { default: ComponentType } {
  return { default: Object.values(module).find((value) => typeof value === 'function') as ComponentType };
}

export const ${exportName}: Record<string, ComponentType> = {
${lines.join('\n')}
};
`,
  );
}

writeComponents('__components__.tsx', 'Components', outsideEditorSet);
writeComponents('__editor-components__.tsx', 'EditorComponents', inEditorSet);

console.log(
  `examples index: ${demos.length} demos, ${published.length} registry items, ${editorSet.size} in the editor set`,
);
