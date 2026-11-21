import type { ReactNode } from 'react';
import { ListIcon } from '@/registry/bases/base-ui/icons/lucide/list-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

export const emailListSlashItem: SlashItem = {
  id: 'email-list',
  title: 'List',
  description: 'A bulleted list of short lines',
  icon: ListIcon,
  group: 'Email',
  keywords: ['list', 'bullet', 'ul'],
  command: 'insertEmailBlock',
  args: { kind: 'list' },
};

function EmailListView({ attrs, children }: NodeViewProps<EmailBlockStyle>) {
  return (
    <div data-slot="email-list" role="list" className={cn('list-disc ps-6', blockClasses(attrs))}>
      {children as ReactNode}
    </div>
  );
}

function EmailListItemView({ children }: NodeViewProps) {
  return (
    <div data-slot="email-list-item" role="listitem" className="list-item">
      {children as ReactNode}
    </div>
  );
}

/** The list and its items: each item is one line of text, as the export stores it. */
export function emailListNodes(): NodeSpec[] {
  return [
    { ...emailSpec('emailList'), render: EmailListView },
    { ...emailSpec('emailListItem'), render: EmailListItemView },
  ];
}
