import type { ReactNode } from 'react';
import { InfoIcon } from '@/registry/bases/base-ui/icons/lucide/info-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

export const emailCalloutSlashItem: SlashItem = {
  id: 'email-callout',
  title: 'Callout',
  description: 'Text set apart in a panel',
  icon: InfoIcon,
  group: 'Email',
  keywords: ['callout', 'note', 'notice'],
  command: 'insertEmailBlock',
  args: { kind: 'callout' },
};

// The alert's slots without the component, whose role would announce every callout as it renders.
function EmailCalloutView({ attrs, children }: NodeViewProps<EmailBlockStyle>) {
  return (
    <div data-slot="email-callout" className={cn('cn-alert block text-[length:inherit]', blockClasses(attrs))}>
      {children as ReactNode}
    </div>
  );
}

export function emailCalloutNode(): NodeSpec {
  return { ...emailSpec('emailCallout'), render: EmailCalloutView };
}
