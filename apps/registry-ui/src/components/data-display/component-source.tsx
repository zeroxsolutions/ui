import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ComponentProps, ReactNode } from 'react';

import { CodeCollapsibleWrapper } from '@/components/data-display/code-collapsible-wrapper';
import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { highlightCode } from '@/lib/highlight-code';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

interface ComponentSourceProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first: a type or a helper the item carries beside its component. */
  file?: string;
  /** A file name the block's header shows beside its language. */
  title?: string;
  /** The language to highlight as; the file's extension when unset. */
  language?: string;
  /** Whether the block is cut to its first lines with `Expand`, as it is on its own in a page. */
  collapsible?: boolean;
  /** Shows only the first this many lines. */
  maxLines?: number;
}

/**
 * A source file of a demo or registry item, highlighted, upstream's `ComponentSource`: its first file,
 * or the one `file` names. It reads the file from disk while it renders, so it belongs only on a route
 * rendered whole at build (`force-static` with every param listed): the worker that serves the route
 * has no such file. Throws for a name the index lacks, or a file the item does not ship.
 */
async function ComponentSource({
  name,
  file,
  title,
  language,
  collapsible = true,
  maxLines,
  className,
}: ComponentSourceProps): Promise<ReactNode> {
  const entry = Index[name];
  if (!entry) throw new Error(`ComponentSource: "${name}" is not in the examples index`);
  const path = file ?? entry.files[0];
  if (!entry.files.includes(path)) throw new Error(`ComponentSource: "${name}" does not ship ${path}`);

  // Untraced: the route is prerendered, so no server bundle reads the file. Traced, the path is too
  // dynamic to scope and Turbopack copies the whole project into the server output.
  let code = await readFile(join(/* turbopackIgnore: true */ process.cwd(), path), 'utf8');
  code = code.trimEnd();
  if (maxLines) code = code.split('\n').slice(0, maxLines).join('\n');

  const lang = language ?? path.split('.').pop() ?? 'tsx';
  const block = (
    <DocsCodeBlock code={code} highlightedCode={await highlightCode(code, lang)} language={lang} title={title} />
  );

  if (!collapsible) return <div className={cn('relative', className)}>{block}</div>;

  return <CodeCollapsibleWrapper className={className}>{block}</CodeCollapsibleWrapper>;
}

export { ComponentSource };
