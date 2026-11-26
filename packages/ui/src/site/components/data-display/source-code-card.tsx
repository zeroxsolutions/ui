'use client';

import { useMemo, type ComponentProps, type ReactNode } from 'react';

import {
  CodeCard,
  CodeCardCode,
  CodeCardContent,
  CodeCardCopy,
  CodeCardLanguage,
  CodeCardLineNumbers,
} from '../../../../registry/bases/base-ui/components/data-display/code-card';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '../../../../registry/bases/base-ui/components/layout/collapsible-card';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { unpackHighlightLines } from '../../lib/packed-lines';

// The registry's code block and its header parts, across the client boundary their hooks need on a
// server-rendered page. A page composes them: header (title: language, file; actions: copy, trigger),
// then content (line numbers, code).

interface SourceCodeCardProps extends Omit<ComponentProps<typeof CodeCard>, 'lines'> {
  /**
   * `code`'s lines as `packHighlightLines` packed them; `'null'` shows `code` plain, and left out the block
   * highlights itself once it mounts.
   */
  lines?: string;
}

/**
 * The registry's `CodeCard`, given its lines packed. They cross into the client packed and unpack here,
 * because the page's flight data carries a client component's props as they are passed, and the tokens
 * written out in full make a long file's page larger than the platform serves.
 */
function SourceCodeCard({ code, lines, ...props }: SourceCodeCardProps): ReactNode {
  const unpacked = useMemo(() => (lines === undefined ? undefined : unpackHighlightLines(lines, code)), [lines, code]);
  return <CodeCard code={code} lines={unpacked} {...props} />;
}

/** A file's name in a source block's title, beside its language; it truncates when the header is narrow. */
function SourceCodeCardFile({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="source-code-card-file" className={cn('min-w-0 truncate font-mono', className)} {...props} />;
}

export {
  SourceCodeCard,
  CollapsibleCardHeader as SourceCodeCardHeader,
  CollapsibleCardTitle as SourceCodeCardTitle,
  CodeCardLanguage as SourceCodeCardLanguage,
  SourceCodeCardFile,
  CollapsibleCardActions as SourceCodeCardActions,
  CodeCardCopy as SourceCodeCardCopy,
  CollapsibleCardTrigger as SourceCodeCardTrigger,
  CodeCardContent as SourceCodeCardContent,
  CodeCardLineNumbers as SourceCodeCardLineNumbers,
  CodeCardCode as SourceCodeCardCode,
};
