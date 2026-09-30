import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ReactNode } from 'react';

import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import { Index } from '@/registry/bases/base-ui/examples/__index__';
import { highlightToLines } from '@/registry/bases/base-ui/lib/shiki';

interface ComponentSourceProps {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first: a type or a helper the item carries beside its component. */
  file?: string;
  /** A file name the block's header shows beside its language. */
  title?: string;
  /** The language to highlight as; the file's extension when unset. */
  language?: string;
  /** Whether the block carries the card's trigger, so the reader can fold it away. */
  collapsible?: boolean;
  /** Shows only the first this many lines. */
  maxLines?: number;
  /** Placement for the block. */
  className?: string;
}

/**
 * A source file of a demo or registry item in the registry's `CodeBlock`, upstream's `ComponentSource`:
 * its first file, or the one `file` names, tokenized here at build by the registry's highlighter. It reads the file from disk while it renders, so it belongs only on a route
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

  return (
    <SourceCodeBlock
      code={code}
      language={lang}
      lines={await highlightToLines(code, lang)}
      collapsible={collapsible}
      className={className}
    >
      {title}
    </SourceCodeBlock>
  );
}

export { ComponentSource };
