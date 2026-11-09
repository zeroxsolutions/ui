import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseCodeBlockAttributes } from 'fumadocs-core/mdx-plugins/codeblock-utils';

// An app's fumadocs-mdx bundles this module into its `source.config.ts` and leaves a package's import to
// Node, which cannot load a `.tsx` through `@zeroxsolutions/ui`'s exports; it resolves no path alias of
// this package either. A relative path is bundled with it.
import { DEFAULT_PLATFORM_STYLE, PLATFORM_STYLES } from '../constants/platform-styles';
import { Index } from '../../../registry/bases/base-ui/examples/__index__';
import { highlightToLines } from '../../../registry/bases/base-ui/lib/shiki';

interface HastAttribute {
  type: string;
  name: string;
  value?: unknown;
}

interface HastNode {
  type: string;
  tagName?: string;
  name?: string;
  value?: string;
  properties?: Record<string, unknown>;
  attributes?: HastAttribute[];
  data?: { meta?: string };
  children?: HastNode[];
}

/** The components whose source this step reads and highlights for them. */
const SOURCE_COMPONENTS = new Set(['ComponentPreview', 'BlockPreview', 'ComponentSource', 'NativePreview']);

/**
 * Where the web registry's package sits, relative to the app, which is where the build runs. The paths
 * the examples index lists, `registry.json`'s, are relative to it.
 */
const UI_DIR = '../../packages/ui';

/** Where the web registry's build writes each style's items, relative to the app. */
const STYLES_DIR = '../../packages/ui/dist/r/styles';

/** A slot a published file writes, which each style's build replaces with its own classes. */
const SLOT = /\bcn-[a-z0-9-]+/;

/** Where native-ui keeps its demos, relative to the app, which is where the build runs. */
const NATIVE_EXAMPLES_DIR = '../../packages/native-ui/src/examples';

/** A native demo's name, such as `button-demo`; anything else, a path included, names no demo. */
const NATIVE_DEMO_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-demo$/;

function textOf(node: HastNode): string {
  return node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(textOf).join('');
}

function stringAttribute(node: HastNode, name: string): string | undefined {
  const value = node.attributes?.find((attribute) => attribute.name === name)?.value;
  return typeof value === 'string' ? value : undefined;
}

/**
 * The file a `ComponentPreview`, `BlockPreview` or `ComponentSource` shows: its demo's or item's first
 * file, or the one `file` names. Throws for a name the examples index lacks or a file the item does not
 * ship, so a page naming either fails its build.
 */
function sourceFileOf(name: string, file?: string): string {
  const entry = Index[name];
  if (!entry) throw new Error(`rehypeDocsCode: "${name}" is not in the examples index`);
  const path = file ?? entry.files[0];
  if (!entry.files.includes(path)) throw new Error(`rehypeDocsCode: "${name}" does not ship ${path}`);
  return path;
}

/**
 * The file a `NativePreview` shows: its demo in native-ui's examples. Throws for a name that is not a
 * demo's, so a page naming one fails its build.
 */
export async function nativeDemoSourceOf(name: string): Promise<string> {
  const path = NATIVE_DEMO_NAME.test(name) ? join(process.cwd(), NATIVE_EXAMPLES_DIR, `${name}.tsx`) : undefined;
  try {
    if (path) return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  throw new Error(`rehypeDocsCode: "${name}" is not a demo in ${NATIVE_EXAMPLES_DIR}`);
}

async function highlightFence(pre: HastNode): Promise<void> {
  const code = pre.children?.[0];
  if (code?.tagName !== 'code') return;
  const properties: Record<string, unknown> = { ...pre.properties };
  const meta = code.data?.meta;
  if (meta) {
    const { title } = parseCodeBlockAttributes(meta, ['title']).attributes;
    if (typeof title === 'string') properties.title = title;
  }
  const className = code.properties?.className;
  const language = (Array.isArray(className) ? className : [className])
    .map((name) => /^language-(\S+)$/.exec(String(name))?.[1])
    .find(Boolean);
  if (language) properties.lines = JSON.stringify(await highlightToLines(textOf(code).replace(/\n$/, ''), language));
  pre.properties = properties;
}

/**
 * `path` of registry item `name` as `shadcn add` writes it in each web style, read from the registry's
 * build, which the docs app's build runs first. Throws where the build lacks the item or the file.
 */
async function styledSources(name: string, path: string): Promise<Record<string, string>> {
  const sources: Record<string, string> = {};
  for (const style of PLATFORM_STYLES.web) {
    const json = join(process.cwd(), STYLES_DIR, `base-${style}`, `${name}.json`);
    const item = JSON.parse(await readFile(json, 'utf8')) as { files?: { path: string; content?: string }[] };
    const content = item.files?.find((file) => file.path === path)?.content;
    if (content === undefined) throw new Error(`rehypeDocsCode: ${json} does not ship ${path}`);
    sources[style] = content.trimEnd();
  }
  return sources;
}

async function highlightSource(element: HastNode): Promise<void> {
  const name = stringAttribute(element, 'name') ?? '';
  let path: string;
  let code: string;
  if (element.name === 'NativePreview') {
    path = `${name}.tsx`;
    code = (await nativeDemoSourceOf(name)).trimEnd();
  } else {
    path = sourceFileOf(name, stringAttribute(element, 'file'));
    code = (await readFile(join(process.cwd(), UI_DIR, path), 'utf8')).trimEnd();
  }
  const language = stringAttribute(element, 'language') ?? path.split('.').pop() ?? 'tsx';
  const styled: HastAttribute[] = [];
  // A file that writes slots reads as each style writes it, never as its slots: the default style's code
  // in place of the source, and every other style's, highlighted, for the page to show the picker's.
  if (element.name === 'ComponentSource' && SLOT.test(code)) {
    const sources = await styledSources(name, path);
    code = sources[DEFAULT_PLATFORM_STYLE.web];
    const others: Record<string, { code: string; lines: string }> = {};
    for (const [style, source] of Object.entries(sources)) {
      if (style === DEFAULT_PLATFORM_STYLE.web || source === code) continue;
      others[style] = { code: source, lines: JSON.stringify(await highlightToLines(source, language)) };
    }
    styled.push({ type: 'mdxJsxAttribute', name: 'styleSources', value: JSON.stringify(others) });
  }
  element.attributes = [
    ...(element.attributes ?? []),
    ...styled,
    { type: 'mdxJsxAttribute', name: 'code', value: code },
    { type: 'mdxJsxAttribute', name: 'language', value: language },
    { type: 'mdxJsxAttribute', name: 'lines', value: JSON.stringify(await highlightToLines(code, language)) },
  ].filter((attribute, index, all) => all.findIndex((other) => other.name === attribute.name) === index);
}

/**
 * Highlights a docs page's code as the page compiles, with the registry's own highlighter, so nothing
 * the server runs to render a page imports Shiki. A fence's `pre` gets its `title` from the fence's
 * meta and its tokenized `lines` as JSON. A `ComponentPreview`, `BlockPreview`, `ComponentSource` or
 * native page's `NativePreview` gets the source of the file it shows as `code`, its `language`, and its `lines` as JSON;
 * a `ComponentSource` of a file that writes slots gets the default style's code, and every other style's
 * that differs as `styleSources`. It runs after fumadocs has kept
 * the page's Markdown, so none of this reaches the page's `.md`. A demo's source is read once, as its
 * page compiles, so under `next dev` an edited demo shows its old source until the page's `.mdx` is saved.
 */
export function rehypeDocsCode() {
  return async (tree: HastNode): Promise<void> => {
    const jobs: Promise<void>[] = [];
    const visit = (node: HastNode): void => {
      if (node.tagName === 'pre') jobs.push(highlightFence(node));
      else if (node.type === 'mdxJsxFlowElement' && SOURCE_COMPONENTS.has(node.name ?? '')) {
        jobs.push(highlightSource(node));
      }
      node.children?.forEach(visit);
    };
    visit(tree);
    await Promise.all(jobs);
  };
}
