'use client';

import type { ComponentProps, ReactNode } from 'react';

import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockLanguage,
  CodeBlockLineNumbers,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { cn } from '@/registry/bases/base-ui/lib/utils';

// The registry's code block and its header parts, across the client boundary their hooks need on a
// server-rendered page. A page composes them: header (title: language, file; actions: copy, trigger),
// then content (line numbers, code).

/** A file's name in a source block's title, beside its language; it truncates when the header is narrow. */
function SourceCodeBlockFile({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="source-code-block-file" className={cn('min-w-0 truncate font-mono', className)} {...props} />;
}

export {
  CodeBlock as SourceCodeBlock,
  CollapsibleCardHeader as SourceCodeBlockHeader,
  CollapsibleCardTitle as SourceCodeBlockTitle,
  CodeBlockLanguage as SourceCodeBlockLanguage,
  SourceCodeBlockFile,
  CollapsibleCardActions as SourceCodeBlockActions,
  CodeBlockCopy as SourceCodeBlockCopy,
  CollapsibleCardTrigger as SourceCodeBlockTrigger,
  CodeBlockContent as SourceCodeBlockContent,
  CodeBlockLineNumbers as SourceCodeBlockLineNumbers,
  CodeBlockCode as SourceCodeBlockCode,
};
