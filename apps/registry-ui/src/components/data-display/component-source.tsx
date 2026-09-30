import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { highlight } from 'fumadocs-core/highlight';
import type { ComponentProps, ReactNode } from 'react';

import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { CODE_THEMES } from '@/constants/code-themes';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

interface ComponentSourceProps extends Omit<ComponentProps<typeof DocsCodeBlock>, 'code'> {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first: a type or a helper the item carries beside its component. */
  file?: string;
}

/**
 * A source file of a demo or registry item, highlighted: its first file, or the one `file` names. It
 * reads the file from disk while it renders, so it belongs only on a route rendered whole at build
 * (`force-static` with every param listed): the worker that serves the route has no such file. Throws
 * for a name the index lacks, or a file the item does not ship.
 */
async function ComponentSource({ name, file, ...props }: ComponentSourceProps): Promise<ReactNode> {
  const entry = Index[name];
  if (!entry) throw new Error(`ComponentSource: "${name}" is not in the examples index`);
  const path = file ?? entry.files[0];
  if (!entry.files.includes(path)) throw new Error(`ComponentSource: "${name}" does not ship ${path}`);

  // Untraced: the route is prerendered, so no server bundle reads the file. Traced, the path is too
  // dynamic to scope and Turbopack copies the whole project into the server output.
  const code = await readFile(join(/* turbopackIgnore: true */ process.cwd(), path), 'utf8');

  return (
    <DocsCodeBlock code={code} {...props}>
      {await highlight(code, { lang: 'tsx', themes: CODE_THEMES, defaultColor: false })}
    </DocsCodeBlock>
  );
}

export { ComponentSource };
