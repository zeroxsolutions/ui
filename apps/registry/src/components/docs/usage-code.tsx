'use client';

import { CodeBlock } from '@zeroxsolutions/ui/components/code-block';

/**
 * The deployed base URL the `shadcn add` command resolves the item against. The
 * same host serves the static registry JSON under `/r/<name>.json`.
 */
const REGISTRY_BASE_URL = 'https://registry.zeroxsolutions.com';

export interface UsageCodeProps {
  /** Registry item name - the `<name>` segment of `/r/<name>.json`. */
  name: string;
  /** Import path suffix, e.g. `components/ui/button` or `components/menu-button`. */
  importPath: string;
  /** Named export the import snippet pulls, e.g. `Button` or `MenuButton`. */
  exportedAs: string;
}

/**
 * Renders the two code snippets a documented item needs - the `shadcn add`
 * command and the import snippet - in copyable `CodeBlock`s (the shipped
 * code surface). Both strings are derived from the item's `name` + the
 * deployed registry URL plus its import path, so no hand-authoring is needed
 * for the Code section (Decision 1). `CodeBlock` is a client component (its
 * Shiki highlighter runs as an effect), so this file carries `'use client'` to
 * place the boundary at the docs component rather than inside the UI library.
 */
export function UsageCode({ name, importPath, exportedAs }: UsageCodeProps) {
  const installCommand = `npx shadcn add ${REGISTRY_BASE_URL}/r/${name}.json`;
  const importSnippet = `import { ${exportedAs} } from '@zeroxsolutions/ui/${importPath}';`;

  return (
    <div data-slot="usage-code" className="flex flex-col gap-3">
      <CodeBlock code={installCommand} language="bash" />
      <CodeBlock code={importSnippet} language="ts" />
    </div>
  );
}
