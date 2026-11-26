import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CONTENT = resolve(__dirname, '../../../../packages/native-ui-docs-web/content/native/components');

/** The slug of every native component page the docs are written with, its own index aside. */
export const componentPageSlugs: readonly string[] = readdirSync(CONTENT)
  .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
  .map((file) => file.slice(0, -'.mdx'.length));

/** The name of every item the native registry publishes, read off the registry it is built from. */
export const registryItemNames: readonly string[] = (
  JSON.parse(readFileSync(resolve(__dirname, '../../../../packages/native-ui/registry.json'), 'utf8')) as {
    items: { name: string }[];
  }
).items.map(({ name }) => name);

/** The title a component page's frontmatter gives it, which the sidebar shows. */
export function componentPageTitle(slug: string): string {
  const source = readFileSync(join(CONTENT, `${slug}.mdx`), 'utf8');
  const title = /^title:\s*(.+)$/m.exec(source)?.[1]?.trim();
  if (!title) throw new Error(`${slug}.mdx has no title`);
  return title.replace(/^(['"])(.*)\1$/, '$2');
}
