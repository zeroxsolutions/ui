import type { ComponentProps, ReactNode } from 'react';

import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

interface ComponentSourceProps extends Omit<ComponentProps<typeof SourceCodeBlock>, 'code' | 'language' | 'lines'> {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first; `rehypeDocsCode` reads it, not this component. */
  file?: string;
  /** The file's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
  /** Shows only the first this many lines. */
  maxLines?: number;
}

/**
 * A source file of a demo or registry item, as a `SourceCodeBlock` its children compose: its first
 * file, or the one `file` names. Its source and highlighting are read as the docs page compiles, so it
 * works only inside a docs page; anywhere else it throws.
 */
function ComponentSource({
  name,
  file: _file,
  code,
  language,
  lines,
  maxLines,
  ...props
}: ComponentSourceProps): ReactNode {
  if (code === undefined) throw new Error(`ComponentSource: "${name}" has no source; only a docs page reads it`);
  const highlighted = lines ? (JSON.parse(lines) as HighlightLine[] | null) : null;

  return (
    <SourceCodeBlock
      code={maxLines ? code.split('\n').slice(0, maxLines).join('\n') : code}
      language={language}
      lines={maxLines ? (highlighted?.slice(0, maxLines) ?? null) : highlighted}
      {...props}
    />
  );
}

export { ComponentSource };
