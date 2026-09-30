import type { RehypeCodeOptions } from 'fumadocs-core/mdx-plugins/rehype-code';
import { codeToHtml } from 'shiki';

import { CODE_THEMES } from '@/constants/code-themes';

type Transformer = NonNullable<RehypeCodeOptions['transformers']>[number];
// The hast node types, as the transformer's own hooks take them; the app declares no `@types/hast`.
type Root = Parameters<NonNullable<Transformer['root']>>[0];
type Element = Parameters<NonNullable<Transformer['pre']>>[0];
type ElementContent = Element['children'][number];

/** A shell command as each package manager spells it. */
export interface PackageManagerCommands {
  npm: string;
  yarn: string;
  pnpm: string;
  bun: string;
}

/**
 * `raw` as each package manager spells it, when it is an npm command one of them can rewrite: an
 * `npm install`, `npx create-`, `npm create`, `npx` or `npm run` line, as upstream's transformer reads them.
 */
export function packageManagerCommands(raw: string): PackageManagerCommands | undefined {
  if (raw.startsWith('npm install')) {
    return {
      npm: raw,
      yarn: raw.replace('npm install', 'yarn add'),
      pnpm: raw.replace('npm install', 'pnpm add'),
      bun: raw.replace('npm install', 'bun add'),
    };
  }
  if (raw.startsWith('npx create-')) {
    return {
      npm: raw,
      yarn: raw.replace('npx create-', 'yarn create '),
      pnpm: raw.replace('npx create-', 'pnpm create '),
      bun: raw.replace('npx', 'bunx --bun'),
    };
  }
  if (raw.startsWith('npm create')) {
    return {
      npm: raw,
      yarn: raw.replace('npm create', 'yarn create'),
      pnpm: raw.replace('npm create', 'pnpm create'),
      bun: raw.replace('npm create', 'bun create'),
    };
  }
  if (raw.startsWith('npx')) {
    return {
      npm: raw,
      yarn: raw.replace('npx', 'yarn dlx'),
      pnpm: raw.replace('npx', 'pnpm dlx'),
      bun: raw.replace('npx', 'bunx --bun'),
    };
  }
  if (raw.startsWith('npm run')) {
    return {
      npm: raw,
      yarn: raw.replace('npm run', 'yarn'),
      pnpm: raw.replace('npm run', 'pnpm'),
      bun: raw.replace('npm run', 'bun'),
    };
  }
  return undefined;
}

/**
 * The transformers every MDX code fence is highlighted with, passed to fumadocs' `rehypeCode` by
 * `source.config.ts`, as upstream passes its own to rehype-pretty-code. The first puts the fence's text
 * on its `pre` as `__raw__`, for the copy button the MDX `pre` component puts outside the block's
 * scroller, and each package manager's spelling of an npm command on its `code`, which the MDX `code`
 * component turns into a package-manager block. The second builds the
 * tree rehype-pretty-code builds and fumadocs does not: the block in a `figure`, headed by a
 * `figcaption` carrying the fence's language and its `title`, every line marked `data-line`. Typed as
 * fumadocs takes them: its Shiki is a later release than this app's.
 */
export const transformers: Transformer[] = [
  {
    name: 'registry-ui:raw-and-commands',
    pre(node) {
      node.properties['__raw__'] = this.source;
    },
    code(node) {
      const raw = this.source;
      const commands = packageManagerCommands(raw);
      if (!commands) return;
      node.properties['__npm__'] = commands.npm;
      node.properties['__yarn__'] = commands.yarn;
      node.properties['__pnpm__'] = commands.pnpm;
      node.properties['__bun__'] = commands.bun;
    },
  },
  {
    name: 'registry-ui:code-figure',
    pre(node) {
      node.properties['data-language'] = this.options.lang;
      // Shiki copies the fence's meta onto the `pre`; the title belongs to the figcaption, not a tooltip.
      delete node.properties['title'];
    },
    line(node) {
      node.properties['data-line'] = '';
    },
    root(root): Root {
      const language = String(this.options.lang);
      const title = this.options.meta?.['title'];
      const pre = root.children.find((child): child is Element => child.type === 'element');
      // A package-manager block heads itself with its tabs.
      if (!pre || packageManagerCommands(this.source)) {
        return { type: 'root', children: [figure(root.children as ElementContent[])] };
      }
      const caption: Element = {
        type: 'element',
        tagName: 'figcaption',
        properties: { 'data-code-title': '', 'data-language': language },
        children: typeof title === 'string' && title ? [{ type: 'text', value: title }] : [],
      };
      return { type: 'root', children: [figure([caption, pre])] };
    },
  },
];

function figure(children: ElementContent[]): Element {
  return { type: 'element', tagName: 'figure', properties: { 'data-code-figure': '' }, children };
}

/**
 * The class every highlighted `pre` carries, upstream's less its overflow: the `ScrollArea` around it
 * is the block's scroller.
 */
const PRE_CLASS =
  'min-w-0 px-4 py-3.5 outline-none has-[[data-highlighted-line]]:px-0 has-[[data-line-numbers]]:px-0 has-[[data-slot=tabs]]:p-0 !bg-transparent';

// Every route that highlights is rendered at build, so a module-level map lives for one build and
// never grows on the worker; upstream's LRU bounds a server that highlights per request.
const highlightCache = new Map<string, Promise<string>>();

/**
 * `code` highlighted as `language` in both of the site's themes, as HTML: a `pre` whose `code` numbers
 * its lines, each line `data-line`. Each token carries the light colour and the dark one as
 * `--shiki-dark`, which the stylesheet switches to under `.dark`. The one Shiki entry point in `src/`;
 * MDX fences are highlighted at compile with this module's `transformers`.
 */
export function highlightCode(code: string, language = 'tsx'): Promise<string> {
  const key = `${language}:${code}`;
  const cached = highlightCache.get(key);
  if (cached) return cached;

  const html = codeToHtml(code, {
    lang: language,
    themes: CODE_THEMES,
    transformers: [
      {
        pre(node) {
          node.properties['class'] = PRE_CLASS;
        },
        code(node) {
          node.properties['data-line-numbers'] = '';
        },
        line(node) {
          node.properties['data-line'] = '';
        },
      },
    ],
  });
  highlightCache.set(key, html);
  return html;
}
