import { MousePointerClickIcon } from '@/registry/bases/base-ui/icons/lucide/mouse-pointer-click-icon';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { contextOf, messagesOf, selectBlockOf } from '../kit-context';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { VariableTextField } from '../../variables/variable-text-field';
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
 * The button block. Its label is an attribute, edited in a variable text field, so it carries no mark but may
 * hold variables; its href is set in the link popover the block menu's Link opens.
 */
export function emailButtonNode(): NodeSpec {
  function EmailButtonView({ attrs, updateAttrs, editable, editor }: NodeViewProps<EmailButtonAttrs>) {
    const full = attrs.width === 'full';
    const messages = messagesOf(editor);
    const context = contextOf(editor)?.context;
    return (
      <div
        data-slot="email-button"
        data-width={attrs.width ?? 'inline'}
        contentEditable={false}
        // Its label field takes the focus without moving the selection; Mod-/ acts on the selected block.
        onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
        className={cn('flex', justifyClass(attrs.align), blockClasses(attrs))}
      >
        <div className={cn(buttonVariants({ variant: 'default' }), full && 'w-full')}>
          <VariableTextField
            value={attrs.label ?? ''}
            onValueChange={(label) => updateAttrs({ label })}
            declarations={() => context?.declarations() ?? []}
            variables={context?.variables}
            label={messages.buttonLabel}
            placeholder={messages.buttonLabel}
            readOnly={!editable}
            messages={messages}
            className="min-w-16 text-center"
          />
        </div>
      </div>
    );
  }
  return { ...emailSpec('emailButton'), render: EmailButtonView };
}
