import type { ReactNode } from 'react';
import { CodeIcon } from '@/registry/bases/base-ui/icons/lucide/code-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

export const emailCodeSlashItem: SlashItem = {
  id: 'email-code',
  title: DEFAULT_PROFILE_MESSAGES.blocks.code.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.code.description,
  icon: CodeIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['code', 'monospace', 'otp'],
  command: 'insertEmailBlock',
  args: { kind: 'code' },
};

/** Plain text in a fixed-width face; it carries no mark, since the export stores it as plain text. */
function EmailCodeView({ attrs, children }: NodeViewProps<EmailBlockStyle>) {
  return (
    <div data-slot="email-code" className={cn('cn-editor-block bg-muted p-3 font-mono text-sm', blockClasses(attrs))}>
      {children as ReactNode}
    </div>
  );
}

export function emailCodeNode(): NodeSpec {
  return { ...emailSpec('emailCode'), render: EmailCodeView };
}
