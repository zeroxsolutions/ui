import type { ReactNode } from 'react';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { messagesOf } from '../kit-context';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

export const emailHtmlSlashItem: SlashItem = {
  id: 'email-html',
  title: DEFAULT_PROFILE_MESSAGES.blocks.html.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.html.description,
  icon: LayoutPanelTopIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['html', 'markup', 'raw'],
  command: 'insertEmailBlock',
  args: { kind: 'html' },
};

/** Markup edited as its source text; it carries no mark, since the export stores the source as written. */
function EmailHtmlView({ attrs, children, editor }: NodeViewProps<EmailBlockStyle>) {
  return (
    <div data-slot="email-html" className={cn('cn-editor-block border p-3', blockClasses(attrs))}>
      <span contentEditable={false} className="text-muted-foreground mb-1 block text-xs font-medium select-none">
        {messagesOf(editor).htmlBlock}
      </span>
      <div className="font-mono text-sm">{children as ReactNode}</div>
    </div>
  );
}

export function emailHtmlNode(): NodeSpec {
  return { ...emailSpec('emailHtml'), render: EmailHtmlView };
}
