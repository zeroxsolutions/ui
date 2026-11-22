import { MinusIcon } from '@/registry/bases/base-ui/icons/lucide/minus-icon';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

export const emailDividerSlashItem: SlashItem = {
  id: 'email-divider',
  title: DEFAULT_PROFILE_MESSAGES.blocks.divider.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.divider.description,
  icon: MinusIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['divider', 'rule', 'separator', 'hr'],
  command: 'insertEmailBlock',
  args: { kind: 'divider' },
};

function EmailDividerView({ attrs, selected }: NodeViewProps<EmailBlockStyle>) {
  return (
    <div data-slot="email-divider" contentEditable={false} className={cn('py-2', blockClasses(attrs))}>
      <Separator className={cn(selected && 'bg-ring')} />
    </div>
  );
}

export function emailDividerNode(): NodeSpec {
  return { ...emailSpec('emailDivider'), render: EmailDividerView };
}
