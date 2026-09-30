import type { ReactNode } from 'react';

import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

interface ComponentSourceProps {
  /** A demo or registry item name in the examples index. */
  name: string;
  /** One of the files the item ships, when it is not the first: a type or a helper the item carries beside its component. */
  file?: string;
  /** A file name the block's header shows beside its language. */
  title?: string;
  /** The file's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
  /** Whether the block carries the card's trigger, so the reader can fold it away. */
  collapsible?: boolean;
  /** Whether the block carries a copy button; a block cut to its first lines copies nothing. */
  copyable?: boolean;
  /** Shows only the first this many lines. */
  maxLines?: number;
  /** Placement for the block. */
  className?: string;
}

/**
 * A source file of a demo or registry item in the registry's `CodeBlock`, numbered by line: its first
 * file, or the one `file` names. Its source and highlighting are read as the docs page compiles, so it
 * works only inside a docs page; anywhere else it throws.
 */
function ComponentSource({
  name,
  title,
  code,
  language,
  lines,
  collapsible = true,
  copyable = true,
  maxLines,
  className,
}: ComponentSourceProps): ReactNode {
  if (code === undefined) throw new Error(`ComponentSource: "${name}" has no source; only a docs page reads it`);
  const highlighted = lines ? (JSON.parse(lines) as HighlightLine[] | null) : null;

  return (
    <SourceCodeBlock
      code={maxLines ? code.split('\n').slice(0, maxLines).join('\n') : code}
      language={language}
      lines={maxLines ? (highlighted?.slice(0, maxLines) ?? null) : highlighted}
      lineNumbers
      collapsible={collapsible}
      copyable={copyable}
      className={className}
    >
      {title}
    </SourceCodeBlock>
  );
}

export { ComponentSource };
