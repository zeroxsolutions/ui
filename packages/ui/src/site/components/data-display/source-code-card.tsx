'use client';

import type { ComponentProps, ReactNode } from 'react';

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

// The registry's code block and its header parts, across the client boundary their hooks need on a
// server-rendered page. A page composes them: header (title: language, file; actions: copy, trigger),
// then content (line numbers, code).

/** A file's name in a source block's title, beside its language; it truncates when the header is narrow. */
function SourceCodeCardFile({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="source-code-card-file" className={cn('min-w-0 truncate font-mono', className)} {...props} />;
}

export {
  CodeCard as SourceCodeCard,
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
