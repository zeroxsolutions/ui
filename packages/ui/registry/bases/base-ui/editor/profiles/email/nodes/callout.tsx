import type { ReactNode } from 'react';
import { InfoIcon } from '@/registry/bases/base-ui/icons/lucide/info-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

export const emailCalloutSlashItem: SlashItem = {
  id: 'email-callout',
  title: DEFAULT_PROFILE_MESSAGES.blocks.callout.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.callout.description,
  icon: InfoIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
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
