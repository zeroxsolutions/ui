import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseCodeBlockAttributes } from 'fumadocs-core/mdx-plugins/codeblock-utils';

import { Index } from '@/registry/bases/base-ui/examples/__index__';
import { highlightToLines } from '@/registry/bases/base-ui/lib/shiki';

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
async function nativeDemoSourceOf(name: string): Promise<string> {
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

async function highlightSource(element: HastNode): Promise<void> {
  const name = stringAttribute(element, 'name') ?? '';
  let path: string;
  let code: string;
  if (element.name === 'NativePreview') {
    path = `${name}.tsx`;
    code = (await nativeDemoSourceOf(name)).trimEnd();
  } else {
    path = sourceFileOf(name, stringAttribute(element, 'file'));
    // Read relative to the app, which is where the build runs.
    code = (await readFile(join(process.cwd(), path), 'utf8')).trimEnd();
  }
  const language = stringAttribute(element, 'language') ?? path.split('.').pop() ?? 'tsx';
  element.attributes = [
    ...(element.attributes ?? []),
    { type: 'mdxJsxAttribute', name: 'code', value: code },
    { type: 'mdxJsxAttribute', name: 'language', value: language },
    { type: 'mdxJsxAttribute', name: 'lines', value: JSON.stringify(await highlightToLines(code, language)) },
  ].filter((attribute, index, all) => all.findIndex((other) => other.name === attribute.name) === index);
}

/**
 * Highlights a docs page's code as the page compiles, with the registry's own highlighter, so nothing
 * the server runs to render a page imports Shiki. A fence's `pre` gets its `title` from the fence's
 * meta and its tokenized `lines` as JSON. A `ComponentPreview`, `BlockPreview`, `ComponentSource` or
 * native page's `NativePreview` gets the source of the file it shows as `code`, its `language`, and its `lines` as JSON. It runs after fumadocs has kept
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
