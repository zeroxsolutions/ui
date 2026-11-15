import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface RegistryItem {
  name: string;
  title: string;
  type: string;
  categories?: string[];
}

const registry = JSON.parse(readFileSync(resolve(__dirname, '../../../../packages/ui/registry.json'), 'utf8')) as {
  items: RegistryItem[];
};

/** The registry's items in the `editor` category, each of which has a page under `/docs/editor`. */
export const editorItems: RegistryItem[] = registry.items.filter((item) => item.categories?.[0] === 'editor');
