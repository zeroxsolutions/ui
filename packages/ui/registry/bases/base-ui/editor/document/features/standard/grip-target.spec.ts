import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const UI_ROOT = resolve(import.meta.dirname, '../../../../../../..');
const EXTENSION = 'tiptap-extension-global-drag-handle';
const extensionEntry = require.resolve(EXTENSION);
const extensionSource = readFileSync(extensionEntry, 'utf8');
const commandsSource = readFileSync(
  resolve(UI_ROOT, '../editor-core/src/document/core/command/built-in-commands.ts'),
  'utf8',
);

const quoted = (list: string) => [...list.matchAll(/'([^']+)'/g)].map(([, value]) => value);

describe('the grip menu and the drag handle extension it follows', () => {
  it('looks for the same elements the extension puts its handle beside', () => {
    const extension = extensionSource.match(/const selectors = \[([\s\S]*?)\.\.\.options\.customNodes/)?.[1];
    const menu = commandsSource.match(/const DRAG_HANDLE_TARGETS = '([^']+)'/)?.[1];
    expect(extension).toBeDefined();
    expect(menu).toBeDefined();
    expect(menu!.split(', ')).toEqual(quoted(extension!));
  });

  it('reaches as far right of the pointer as the extension does, reading its width under its name', () => {
    const offsets = [...extensionSource.matchAll(/clientX \+ (\d+) \+ options\.dragHandleWidth/g)].map(([, n]) =>
      Number(n),
    );
    const offset = Number(commandsSource.match(/const DRAG_HANDLE_OFFSET_PX = (\d+);/)?.[1]);
    const width = Number(commandsSource.match(/const DRAG_HANDLE_DEFAULT_WIDTH_PX = (\d+);/)?.[1]);
    expect(offsets.length).toBeGreaterThan(0);
    for (const found of offsets) expect(found).toBe(offset);
    expect(extensionSource).toMatch(new RegExp(`dragHandleWidth: ${width},`));
    expect(extensionSource).toContain("name: 'globalDragHandle'");
    expect(commandsSource).toContain("extension.name === 'globalDragHandle'");
  });

  it('is installed at the version the package and the registry item pin', () => {
    const installed = JSON.parse(readFileSync(resolve(dirname(extensionEntry), '../package.json'), 'utf8')).version;
    const manifest = JSON.parse(readFileSync(resolve(UI_ROOT, 'package.json'), 'utf8'));
    const registry = JSON.parse(readFileSync(resolve(UI_ROOT, 'registry.json'), 'utf8'));
    const item = registry.items.find((candidate: { name: string }) => candidate.name === 'document-editor');
    expect(manifest.dependencies[EXTENSION]).toBe(installed);
    expect(item.dependencies).toContain(`${EXTENSION}@${installed}`);
  });
});
