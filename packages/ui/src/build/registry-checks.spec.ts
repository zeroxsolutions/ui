// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import {
  BASE,
  type CssBlock,
  ITEM_PREFIX,
  registryChecks,
  type RegistryFile,
  type RegistryItem,
} from './registry-checks';

/** A package of the registry's shape: each source by its path under the root, imports included. */
const TREE: Record<string, string> = {
  [`${BASE}/ui/button.tsx`]: '',
  [`${BASE}/ui/input.tsx`]: '',
  [`${BASE}/ui/card.tsx`]: '',
  [`${BASE}/ui/toggle-group.tsx`]: '',
  [`${BASE}/lib/utils.ts`]: '',
  [`${BASE}/lib/ime.ts`]: '',
  [`${BASE}/types/status-tone.ts`]: '',
  [`${BASE}/hooks/use-prefers-reduced-motion.ts`]: "import { useState } from 'react';\n",
  [`${BASE}/icons/lucide/chevron-right-icon.tsx`]: '',
  [`${BASE}/icons/lucide/copy-icon.tsx`]: '',
  [`${BASE}/icons/lucide/check-icon.tsx`]: '',
  [`${BASE}/components/data-display/tree-item.tsx`]: [
    "import { Button } from '@/registry/bases/base-ui/ui/button';",
    "import { Input } from '@/registry/bases/base-ui/ui/input';",
    "import { cn } from '@/registry/bases/base-ui/lib/utils';",
    "import { ChevronRightIcon } from '@/registry/bases/base-ui/icons/lucide/chevron-right-icon';",
    "import { usePrefersReducedMotion } from '@/registry/bases/base-ui/hooks/use-prefers-reduced-motion';",
    "import { isComposing } from '@/registry/bases/base-ui/lib/ime';",
  ].join('\n'),
  [`${BASE}/components/data-entry/emoji-appearance-toggle-group.tsx`]: [
    "import { FluentEmoji } from '@zeroxsolutions/fluent-emoji';",
    "import { ToggleGroup } from '@/registry/bases/base-ui/ui/toggle-group';",
    "import { cn } from '@/registry/bases/base-ui/lib/utils';",
  ].join('\n'),
  [`${BASE}/components/data-display/ai-provider-card.tsx`]: '',
  [`${BASE}/components/data-entry/ai-provider-picker.tsx`]: [
    "import { OpenAI } from '@zeroxsolutions/icons';",
    "import { Card } from '@/registry/bases/base-ui/ui/card';",
    "import { cn } from '@/registry/bases/base-ui/lib/utils';",
    "import { AiProviderCard } from '@/registry/bases/base-ui/components/data-display/ai-provider-card';",
  ].join('\n'),
  [`${BASE}/components/feedback/copy-button.tsx`]: [
    "import { Button } from '@/registry/bases/base-ui/ui/button';",
    "import { CopyIcon } from '@/registry/bases/base-ui/icons/lucide/copy-icon';",
    "import { CheckIcon } from '@/registry/bases/base-ui/icons/lucide/check-icon';",
  ].join('\n'),
  [`${BASE}/components/feedback/status-indicator.tsx`]: [
    "import type { StatusTone } from '@/registry/bases/base-ui/types/status-tone';",
    "const TONES = { ok: 'bg-success', slow: 'text-warning' };",
  ].join('\n'),
  [`${BASE}/editor/document/features/mention/mention.tsx`]: '',
  [`${BASE}/editor/code/code-editor.tsx`]: '',
  [`${BASE}/editor/x.tsx`]: '',
  [`${BASE}/editor/x.spec.tsx`]: '',
  [`${BASE}/styles.css`]: [
    ':root {',
    '  --success: oklch(0.6 0.2 150);',
    '  --warning: oklch(0.7 0.2 80);',
    '  --hue-red: oklch(0.5 0.2 27);',
    '}',
    '',
    '.dark {',
    '  --success: oklch(0.7 0.2 150);',
    '  --warning: oklch(0.8 0.2 80);',
    '  --hue-red: oklch(0.7 0.2 22);',
    '}',
    '',
    '@utility bg-checkerboard {',
    '  background-image: repeating-conic-gradient(var(--muted) 0 25%, var(--background) 0 50%);',
    '  background-size: 16px 16px;',
    '}',
    '',
    '@keyframes meteor {',
    '  0% { opacity: 1; }',
    '  100% { opacity: 0; }',
    '}',
  ].join('\n'),
  [`${BASE}/editor/styles.css`]: [
    '@plugin "@tailwindcss/typography";',
    '@layer components {',
    '  .document-editor .ProseMirror { outline: none; }',
    '}',
    '.document-editor ul p,',
    '.document-editor ol p { margin-top: 0; }',
  ].join('\n'),
};

const root = mkdtempSync(join(tmpdir(), 'registry-checks-'));
for (const [path, source] of Object.entries(TREE)) {
  mkdirSync(join(root, dirname(path)), { recursive: true });
  writeFileSync(join(root, path), source);
}
afterAll(() => rmSync(root, { recursive: true, force: true }));

const {
  sourceOf,
  ownersOf,
  declarationProblems,
  cssVarsProblems,
  cssProblems,
  editorCssProblems,
  familyProblems,
  editorFiles,
  editorProblems,
  targetProblems,
  demoProblems,
} = registryChecks(root);

const component = (path: string): RegistryFile => ({ path: `${BASE}/${path}`, type: 'registry:component' });

const treeItem: RegistryItem = {
  name: 'tree-item',
  type: 'registry:component',
  registryDependencies: ['@shadcn/button', '@shadcn/input', '@shadcn/utils', `${ITEM_PREFIX}lucide-chevron-right-icon`],
  files: [
    component('components/data-display/tree-item.tsx'),
    { path: `${BASE}/hooks/use-prefers-reduced-motion.ts`, type: 'registry:hook' },
    { path: `${BASE}/lib/ime.ts`, type: 'registry:lib' },
  ],
};

const emojiAppearanceToggleGroup: RegistryItem = {
  name: 'emoji-appearance-toggle-group',
  type: 'registry:component',
  dependencies: ['@zeroxsolutions/fluent-emoji'],
  registryDependencies: ['@shadcn/toggle-group', '@shadcn/utils'],
  files: [component('components/data-entry/emoji-appearance-toggle-group.tsx')],
};

const aiProviderPicker: RegistryItem = {
  name: 'ai-provider-picker',
  type: 'registry:component',
  dependencies: ['@zeroxsolutions/icons'],
  registryDependencies: ['@shadcn/card', '@shadcn/utils', `${ITEM_PREFIX}ai-provider-card`],
  files: [component('components/data-entry/ai-provider-picker.tsx')],
};

const icon = (name: string): RegistryItem => ({
  name: `lucide-${name}`,
  type: 'registry:ui',
  files: [{ path: `${BASE}/icons/lucide/${name}.tsx`, type: 'registry:ui' }],
});

const ICON_OWNERS = ownersOf(['chevron-right-icon', 'copy-icon', 'check-icon'].map(icon));

describe('declarationProblems', () => {
  it('refuses a relative import ending .js, which Turbopack cannot resolve', () => {
    expect(() => sourceOf(`${BASE}/editor/x.tsx`, './y.js')).toThrow(
      `${BASE}/editor/x.tsx imports ./y.js, which Turbopack cannot resolve; drop the .js`,
    );
  });

  it('reports nothing for an item declaring exactly what its files import', () => {
    expect(declarationProblems(treeItem, ICON_OWNERS)).toEqual([]);
  });

  it('reports a lib file the item imports but does not ship', () => {
    const item = { ...treeItem, files: treeItem.files.filter((file) => file.path !== `${BASE}/lib/ime.ts`) };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual([
      'tree-item: files lacks registry/bases/base-ui/lib/ime.ts (registry:lib)',
    ]);
  });

  it('reports a shipped file no file of the item imports', () => {
    const item = {
      ...treeItem,
      files: [...treeItem.files, { path: `${BASE}/types/status-tone.ts`, type: 'registry:lib' }],
    };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual([
      'tree-item: files declares registry/bases/base-ui/types/status-tone.ts (registry:lib), which its files do not import',
    ]);
  });

  it('reports an upstream part the item imports but does not declare', () => {
    const item = { ...treeItem, registryDependencies: treeItem.registryDependencies?.slice(1) };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual(['tree-item: registryDependencies lacks @shadcn/button']);
  });

  it('names an animated icon by its house item name', () => {
    const item = { ...treeItem, registryDependencies: treeItem.registryDependencies?.slice(0, -1) };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual([
      'tree-item: registryDependencies lacks @zui/lucide-chevron-right-icon',
    ]);
  });

  it('reports a registry dependency no file of the item imports', () => {
    const item = { ...treeItem, registryDependencies: [...(treeItem.registryDependencies ?? []), '@shadcn/card'] };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual([
      'tree-item: registryDependencies declares @shadcn/card, which its files do not import',
    ]);
  });

  it('reports a package the item imports but does not declare', () => {
    const item = { ...emojiAppearanceToggleGroup, dependencies: [] };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual([
      'emoji-appearance-toggle-group: dependencies lacks @zeroxsolutions/fluent-emoji',
    ]);
  });

  it("reports a package the item's css imports but does not declare", () => {
    const item = { ...emojiAppearanceToggleGroup, css: { "@import 'katex/dist/katex.min.css'": {} } };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual(['emoji-appearance-toggle-group: dependencies lacks katex']);
    expect(
      declarationProblems({ ...item, dependencies: ['@zeroxsolutions/fluent-emoji', 'katex'] }, ICON_OWNERS),
    ).toEqual([]);
  });

  it('reports a package no file of the item imports', () => {
    const item = { ...emojiAppearanceToggleGroup, dependencies: ['@zeroxsolutions/fluent-emoji', 'shiki'] };
    expect(declarationProblems(item, ICON_OWNERS)).toEqual([
      'emoji-appearance-toggle-group: dependencies declares shiki, which its files do not import',
    ]);
  });

  it('names an animated icon by its house item name, not as a shadcn item', () => {
    const copyButton: RegistryItem = {
      name: 'copy-button',
      type: 'registry:component',
      registryDependencies: ['@shadcn/button', '@shadcn/check', `${ITEM_PREFIX}lucide-copy-icon`],
      files: [component('components/feedback/copy-button.tsx')],
    };
    expect(declarationProblems(copyButton, ICON_OWNERS)).toEqual([
      `copy-button: registryDependencies lacks ${ITEM_PREFIX}lucide-check-icon`,
      'copy-button: registryDependencies declares @shadcn/check, which its files do not import',
    ]);
  });

  it('names the item that ships a component file by its @zui name', () => {
    const owners = new Map([[`${BASE}/components/data-display/ai-provider-card.tsx`, 'ai-provider-card']]);
    expect(declarationProblems(aiProviderPicker, owners)).toEqual([]);
  });

  it('requires a document editor feature to name document-editor, which none of its files imports', () => {
    const mention: RegistryItem = {
      name: 'editor-mention',
      type: 'registry:component',
      files: [component('editor/document/features/mention/mention.tsx')],
    };
    expect(declarationProblems(mention, new Map())).toEqual([
      'editor-mention: registryDependencies lacks @zui/document-editor',
    ]);
    expect(
      declarationProblems({ ...mention, registryDependencies: [`${ITEM_PREFIX}document-editor`] }, new Map()),
    ).toEqual([]);
  });

  it('requires document-editor of no editor item outside a feature folder', () => {
    const codeEditor: RegistryItem = {
      name: 'code-editor',
      type: 'registry:component',
      registryDependencies: [`${ITEM_PREFIX}document-editor`],
      files: [component('editor/code/code-editor.tsx')],
    };
    expect(declarationProblems(codeEditor, new Map())).toEqual([
      'code-editor: registryDependencies declares @zui/document-editor, which its files do not import',
    ]);
  });

  it('reports a component file the item imports that no item ships', () => {
    expect(declarationProblems(aiProviderPicker, ICON_OWNERS)).toEqual([
      'ai-provider-picker: registry/bases/base-ui/components/data-entry/ai-provider-picker.tsx imports @/registry/bases/base-ui/components/data-display/ai-provider-card, which no registry item ships',
    ]);
  });
});

const statusIndicator: RegistryItem = {
  name: 'status-indicator',
  type: 'registry:component',
  registryDependencies: ['@shadcn/utils'],
  files: [
    component('components/feedback/status-indicator.tsx'),
    { path: `${BASE}/types/status-tone.ts`, type: 'registry:lib' },
  ],
};

describe('cssVarsProblems', () => {
  it('reports an item that paints with success or warning and carries no cssVars', () => {
    expect(cssVarsProblems(statusIndicator)).toEqual([
      'status-indicator: paints with success and warning but carries no cssVars',
    ]);
  });

  it('reports cssVars on an item that paints with neither token', () => {
    const item = { ...treeItem, cssVars: { theme: {}, light: {}, dark: {} } };
    expect(cssVarsProblems(item)).toEqual(['tree-item: carries cssVars but paints with neither success nor warning']);
  });

  it('asks the light and dark value of each hue variable an item draws with in its css', () => {
    const item = { ...treeItem, css: { '.x': { color: 'var(--hue-red)' } } };
    expect(cssVarsProblems(item)).toEqual(['tree-item: paints with hue-red but carries no cssVars']);
    const carried = {
      ...item,
      cssVars: {
        theme: { 'color-hue-red': 'var(--hue-red)' },
        light: { 'hue-red': 'oklch(0.5 0.2 27)' },
        dark: { 'hue-red': 'oklch(0.7 0.2 22)' },
      },
    };
    expect(cssVarsProblems(carried)).toEqual([]);
  });

  it('reports cssVars that leave out a token the item paints with', () => {
    const item = {
      ...statusIndicator,
      cssVars: {
        theme: { 'color-success': 'var(--success)' },
        light: { success: 'oklch(0.6 0.2 150)' },
        dark: { success: 'oklch(0.7 0.2 150)' },
      },
    };
    expect(cssVarsProblems(item)).toEqual([
      'status-indicator: cssVars should be {"theme":{"color-success":"var(--success)","color-warning":"var(--warning)"},"light":{"success":"oklch(0.6 0.2 150)","warning":"oklch(0.7 0.2 80)"},"dark":{"success":"oklch(0.7 0.2 150)","warning":"oklch(0.8 0.2 80)"}}',
    ]);
  });
});

const CHECKERBOARD = {
  'background-image': 'repeating-conic-gradient(var(--muted) 0 25%, var(--background) 0 50%)',
  'background-size': '16px 16px',
};

describe('cssProblems', () => {
  it('reports nothing for a rule shipped as styles.css declares it', () => {
    expect(cssProblems({ ...treeItem, css: { '@utility bg-checkerboard': CHECKERBOARD } })).toEqual([]);
  });

  it('reports a rule whose declarations differ from styles.css', () => {
    const css = { '@utility bg-checkerboard': { ...CHECKERBOARD, 'background-size': '8px 8px' } };
    expect(cssProblems({ ...treeItem, css })).toEqual([
      `tree-item: css @utility bg-checkerboard should be ${JSON.stringify(CHECKERBOARD)}`,
    ]);
  });

  it('reports a rule styles.css does not declare', () => {
    expect(cssProblems({ ...treeItem, css: { '@utility bg-missing': {} } })).toEqual([
      'tree-item: css ships @utility bg-missing, which styles.css does not declare',
    ]);
  });

  it('accepts a statement at-rule the editor sheet holds, shipped as an empty rule', () => {
    expect(cssProblems({ ...treeItem, css: { '@plugin "@tailwindcss/typography"': {} } })).toEqual([]);
  });

  it('reports a statement at-rule no sheet holds', () => {
    expect(cssProblems({ ...treeItem, css: { '@plugin "@tailwindcss/forms"': {} } })).toEqual([
      'tree-item: css ships @plugin "@tailwindcss/forms", which styles.css does not declare',
    ]);
  });

  it('reports a statement at-rule shipped with declarations', () => {
    expect(cssProblems({ ...treeItem, css: { '@plugin "@tailwindcss/typography"': { a: 'b' } } })).toEqual([
      'tree-item: css @plugin "@tailwindcss/typography" should be {}',
    ]);
  });

  it('accepts a rule nested in a layer, shipped under that layer', () => {
    const css = { '@layer components': { '.document-editor .ProseMirror': { outline: 'none' } } };
    expect(cssProblems({ ...treeItem, css })).toEqual([]);
  });

  it('reports a nested rule whose declarations differ from the sheet', () => {
    const css = { '@layer components': { '.document-editor .ProseMirror': { outline: 'auto' } } };
    expect(cssProblems({ ...treeItem, css })).toEqual([
      'tree-item: css @layer components { .document-editor .ProseMirror } should be {"outline":"none"}',
    ]);
  });

  it('matches a selector list written across lines by its one-line form', () => {
    const css = { '.document-editor ul p, .document-editor ol p': { 'margin-top': '0' } };
    expect(cssProblems({ ...treeItem, css })).toEqual([]);
  });

  it('compares a rule of nested blocks, such as keyframes, step by step', () => {
    const steps = { '0%': { opacity: '1' }, '100%': { opacity: '0' } };
    expect(cssProblems({ ...treeItem, css: { '@keyframes meteor': steps } })).toEqual([]);
    const css = { '@keyframes meteor': { ...steps, '100%': { opacity: '0.5' } } };
    expect(cssProblems({ ...treeItem, css })).toEqual([
      'tree-item: css @keyframes meteor { 100% } should be {"opacity":"0"}',
    ]);
  });
});

const FAMILIES = [`${BASE}/blocks/ai-provider-picker.tsx`, `${BASE}/components/data-display/tree-item.tsx`];

const familyItems: RegistryItem[] = [
  { ...treeItem, categories: ['data-display'] },
  {
    ...aiProviderPicker,
    type: 'registry:block',
    categories: ['blocks'],
    files: [{ path: FAMILIES[0], type: 'registry:block' }],
  },
];

const example = (name: string, file = name): RegistryItem => ({
  name,
  type: 'registry:example',
  files: [{ path: `${BASE}/examples/${file}.tsx`, type: 'registry:example' }],
});

const treeItemDemo = example('tree-item-demo');
const aiProviderPickerDemo = example('ai-provider-picker-demo');

describe('familyProblems', () => {
  it('reports nothing for items named and categorised after their family files', () => {
    expect(familyProblems([...familyItems, treeItemDemo], FAMILIES)).toEqual([]);
  });

  it('reports a family file no item publishes', () => {
    expect(familyProblems(familyItems.slice(1), FAMILIES)).toEqual([
      'registry/bases/base-ui/components/data-display/tree-item.tsx: is the first file of no item',
    ]);
  });

  it('accepts a family file one item ships as a part', () => {
    const carrier = {
      ...familyItems[1],
      files: [...familyItems[1].files, { path: FAMILIES[1], type: 'registry:component' }],
    };
    expect(familyProblems([carrier], FAMILIES)).toEqual([]);
  });

  it('reports a family file two items ship as a part', () => {
    const part = { path: FAMILIES[1], type: 'registry:component' };
    const first = { ...familyItems[1], files: [...familyItems[1].files, part] };
    const second = { ...first, name: 'ai-provider-grid' };
    expect(familyProblems([first, second], FAMILIES)).toContain(
      'registry/bases/base-ui/components/data-display/tree-item.tsx: is a part of ai-provider-picker and ai-provider-grid',
    );
  });

  it('reports a family file two items publish', () => {
    const twin = { ...familyItems[0], name: 'tree-row' };
    expect(familyProblems([...familyItems, twin], FAMILIES)).toEqual([
      'registry/bases/base-ui/components/data-display/tree-item.tsx: is the first file of tree-item and tree-row',
      'tree-row: name should be tree-item',
    ]);
  });

  it('reports an item whose first file is not a family file', () => {
    const item = {
      name: 'ime',
      type: 'registry:component',
      categories: ['data-entry'],
      files: [{ path: `${BASE}/lib/ime.ts`, type: 'registry:lib' }],
    };
    expect(familyProblems([...familyItems, item], FAMILIES)).toEqual([
      'ime: first file registry/bases/base-ui/lib/ime.ts is not a family file',
    ]);
  });

  it('reports an item not named after its family file', () => {
    expect(familyProblems([{ ...familyItems[0], name: 'tree-row' }, familyItems[1]], FAMILIES)).toEqual([
      'tree-row: name should be tree-item',
    ]);
  });

  it('leaves an item of editor files to editorProblems', () => {
    const editor = {
      name: 'document-editor',
      type: 'registry:component',
      categories: ['editor'],
      files: [{ path: `${BASE}/editor/x.tsx`, type: 'registry:component', target: '@components/editor/x.tsx' }],
    };
    expect(familyProblems([...familyItems, editor], FAMILIES)).toEqual([]);
  });

  it('reports an item not categorised under its kind folder', () => {
    expect(familyProblems([{ ...familyItems[0], categories: ['data-entry'] }, familyItems[1]], FAMILIES)).toEqual([
      'tree-item: categories should be ["data-display"]',
    ]);
  });
});

describe('demoProblems', () => {
  it('reports nothing when each item has one demo and each example is a demo', () => {
    expect(demoProblems([...familyItems, treeItemDemo, aiProviderPickerDemo])).toEqual([]);
  });

  it('accepts a further <name>-<state> example for a state the demo never reaches', () => {
    expect(demoProblems([...familyItems, treeItemDemo, aiProviderPickerDemo, example('tree-item-expanded')])).toEqual(
      [],
    );
  });

  it('reports an item with no demo', () => {
    expect(demoProblems([...familyItems, treeItemDemo])).toEqual([
      'ai-provider-picker: has no ai-provider-picker-demo example',
    ]);
  });

  it('reports an item with two demos', () => {
    expect(demoProblems([...familyItems, treeItemDemo, treeItemDemo, aiProviderPickerDemo])).toEqual([
      'tree-item: has 2 tree-item-demo examples',
    ]);
  });

  it('reports an example that is the demo of no item', () => {
    expect(demoProblems([...familyItems, treeItemDemo, aiProviderPickerDemo, example('button-demo')])).toEqual([
      'button-demo: is the demo of no item',
    ]);
  });

  it('reports a demo whose files[0] names another file', () => {
    expect(demoProblems([...familyItems, example('tree-item-demo', 'button-demo'), aiProviderPickerDemo])).toEqual([
      `tree-item-demo: files[0] should be ${JSON.stringify({
        path: `${BASE}/examples/tree-item-demo.tsx`,
        type: 'registry:example',
      })}`,
    ]);
  });
});

describe('targetProblems', () => {
  const item = (files: RegistryFile[]): RegistryItem => ({ name: 'a', type: 'registry:component', files });

  it('reports nothing for files targeted through the alias of their folder', () => {
    const files = [
      {
        path: `${BASE}/components/data-entry/x.tsx`,
        type: 'registry:component',
        target: '@components/data-entry/x.tsx',
      },
      { path: `${BASE}/editor/document/x.ts`, type: 'registry:lib', target: '@components/editor/document/x.ts' },
      { path: `${BASE}/icons/lucide/x-icon.tsx`, type: 'registry:ui', target: '@components/general/lucide/x-icon.tsx' },
      { path: `${BASE}/examples/x-demo.tsx`, type: 'registry:example', target: '@components/x-demo.tsx' },
      { path: `${BASE}/hooks/use-x.ts`, type: 'registry:hook', target: '@hooks/use-x.ts' },
      { path: `${BASE}/lib/x.ts`, type: 'registry:lib', target: '@lib/x.ts' },
      { path: `${BASE}/types/x.ts`, type: 'registry:lib', target: '@lib/x.ts' },
    ];
    expect(targetProblems([item(files)])).toEqual([]);
  });

  it('reports a plain target, which the CLI reads from the project root', () => {
    const file = { path: `${BASE}/editor/x.tsx`, type: 'registry:component', target: 'components/editor/x.tsx' };
    expect(targetProblems([item([file])])).toEqual([
      `a: ${file.path} should target @components/editor/x.tsx, not components/editor/x.tsx`,
    ]);
  });

  it('reports a component with no target, which loses its kind folder under a renamed components alias', () => {
    const file = component('components/data-entry/x.tsx');
    expect(targetProblems([item([file])])).toEqual([
      `a: ${file.path} should target @components/data-entry/x.tsx, not undefined`,
    ]);
  });

  it('reports a target under the ui alias or the project root', () => {
    const files = [
      { path: `${BASE}/icons/lucide/x-icon.tsx`, type: 'registry:ui', target: '@ui/general/lucide/x-icon.tsx' },
      { path: `${BASE}/lib/x.ts`, type: 'registry:lib', target: '~/lib/x.ts' },
    ];
    expect(targetProblems([item(files)])).toEqual([
      `a: ${files[0].path} should target @components/general/lucide/x-icon.tsx, not @ui/general/lucide/x-icon.tsx`,
      `a: ${files[1].path} should target @lib/x.ts, not ~/lib/x.ts`,
    ]);
  });

  it('reports a file under a folder no rule places', () => {
    const file = { path: `${BASE}/ui/button.tsx`, type: 'registry:ui', target: '@ui/button.tsx' };
    expect(targetProblems([item([file])])).toEqual([`a: ${file.path} is in no folder with an alias target`]);
  });
});

const EDITOR_FILE = `${BASE}/editor/x.tsx`;
const editorItem = (name: string, overrides: Partial<RegistryItem> = {}): RegistryItem => ({
  name,
  type: 'registry:component',
  categories: ['editor'],
  files: [{ path: EDITOR_FILE, type: 'registry:component', target: '@components/editor/x.tsx' }],
  ...overrides,
});

describe('editorFiles', () => {
  it('lists the editor sources, sorted, with no spec or stylesheet', () => {
    expect(editorFiles()).toEqual([
      `${BASE}/editor/code/code-editor.tsx`,
      `${BASE}/editor/document/features/mention/mention.tsx`,
      `${BASE}/editor/x.tsx`,
    ]);
  });
});

describe('editorProblems', () => {
  it('reports an editor file no item ships', () => {
    expect(editorProblems([], [EDITOR_FILE])).toEqual([`${EDITOR_FILE}: ships in no editor item`]);
  });

  it('reports an editor file two items ship', () => {
    expect(editorProblems([editorItem('a'), editorItem('b')], [EDITOR_FILE])).toEqual([
      `${EDITOR_FILE}: ships in a and b`,
    ]);
  });

  it('reports an editor item outside the editor category', () => {
    expect(editorProblems([editorItem('a', { categories: ['data-entry'] })], [EDITOR_FILE])).toEqual([
      'a: category should be editor',
    ]);
  });

  it('reports nothing for one item per file', () => {
    const item = editorItem('a', {
      files: [
        { path: EDITOR_FILE, type: 'registry:component', target: '@components/editor/x.tsx' },
        { path: `${BASE}/lib/ime.ts`, type: 'registry:lib' },
      ],
    });
    expect(editorProblems([item], [EDITOR_FILE])).toEqual([]);
  });
});

const EDITOR_SHEET = `@custom-variant dark (&:is(.dark *));
.x { color: red; }
@layer components {
  .y { color: blue; }
}`;

describe('editorCssProblems', () => {
  const shipping = (name: string, css: CssBlock): RegistryItem => editorItem(name, { css });

  it('reports nothing when one editor item ships each rule and none ships the dark variant', () => {
    const item = shipping('a', { '.x': { color: 'red' }, '@layer components': { '.y': { color: 'blue' } } });
    expect(editorCssProblems([item], EDITOR_SHEET)).toEqual([]);
  });

  it('reports a rule no editor item ships, nested ones by their layer', () => {
    expect(editorCssProblems([shipping('a', { '.x': { color: 'red' } })], EDITOR_SHEET)).toEqual([
      '@layer components { .y }: ships in no editor item',
    ]);
  });

  it('reports a rule two editor items ship', () => {
    const rules = { '.x': { color: 'red' }, '@layer components': { '.y': { color: 'blue' } } };
    expect(editorCssProblems([shipping('a', rules), shipping('b', { '.x': { color: 'red' } })], EDITOR_SHEET)).toEqual([
      '.x: ships in a and b',
    ]);
  });

  it('counts only items of editor files', () => {
    const rules = { '.x': { color: 'red' }, '@layer components': { '.y': { color: 'blue' } } };
    expect(editorCssProblems([{ ...treeItem, css: rules }], EDITOR_SHEET)).toEqual([
      '.x: ships in no editor item',
      '@layer components { .y }: ships in no editor item',
    ]);
  });

  it('reports a shared rule shipped by other items than the ones named for it', () => {
    const rules = {
      '@custom-variant dark (&:is(.dark *))': {},
      '.x': { color: 'red' },
      '@layer components': { '.y': { color: 'blue' } },
    };
    expect(editorCssProblems([shipping('a', rules)], EDITOR_SHEET)).toEqual([
      '@custom-variant dark (&:is(.dark *)): should ship in []',
    ]);
  });
});
