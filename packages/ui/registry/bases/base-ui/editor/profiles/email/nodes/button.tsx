import { MousePointerClickIcon } from '@/registry/bases/base-ui/icons/lucide/mouse-pointer-click-icon';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { messagesOf, selectBlockOf } from '../kit-context';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { blockClasses, emailSpec, justifyClass, type EmailBlockStyle } from './block-style';

interface EmailButtonAttrs extends EmailBlockStyle {
  label?: string | null;
  href?: string | null;
  width?: 'inline' | 'full' | null;
}

export const emailButtonSlashItem: SlashItem = {
  id: 'email-button',
  title: DEFAULT_PROFILE_MESSAGES.blocks.button.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.button.description,
  icon: MousePointerClickIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['button', 'cta', 'link'],
  command: 'insertEmailBlock',
  args: { kind: 'button' },
};

/**
 * The button block. Its label is an attribute, edited in a field, so it carries no mark; its href, one of the
 * `url` variables, is chosen in the block menu's Link.
 */
export function emailButtonNode(): NodeSpec {
  function EmailButtonView({ attrs, updateAttrs, editable, editor }: NodeViewProps<EmailButtonAttrs>) {
    const full = attrs.width === 'full';
    const messages = messagesOf(editor);
    return (
      <div
        data-slot="email-button"
        data-width={attrs.width ?? 'inline'}
        contentEditable={false}
        // Its label field takes the focus without moving the selection; Mod-/ acts on the selected block.
        onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
        className={cn('flex', justifyClass(attrs.align), blockClasses(attrs))}
      >
        <span className={cn(buttonVariants({ variant: 'default' }), full && 'w-full')}>
          <input
            aria-label={messages.buttonLabel}
            placeholder={messages.buttonLabel}
            value={attrs.label ?? ''}
            readOnly={!editable}
            onChange={(event) => updateAttrs({ label: event.target.value })}
            className="field-sizing-content min-w-16 bg-transparent text-center outline-none placeholder:text-current/60"
          />
        </span>
      </div>
    );
  }
  return { ...emailSpec('emailButton'), render: EmailButtonView };
}
