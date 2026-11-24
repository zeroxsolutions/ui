import { MousePointerClickIcon } from '@/registry/bases/base-ui/icons/lucide/mouse-pointer-click-icon';
import type { SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import type { ButtonLabelFieldProps } from '../../../document/features/button/index';
import { contextOf, messagesOf, selectBlockOf } from '../kit-context';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { VariableTextField } from '../../variables/variable-text-field';

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
 * A button's label in the email editor: a variable text field, so it carries no mark but may hold variables. Its
 * href is set in the link popover the block menu's Link opens.
 */
export function EmailButtonLabelField({ value, onValueChange, readOnly, editor }: ButtonLabelFieldProps) {
  const messages = messagesOf(editor);
  const context = contextOf(editor)?.context;
  return (
    <span
      className="contents"
      // The field takes the focus without moving the selection; Mod-/ acts on the selected block.
      onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
    >
      <VariableTextField
        value={value}
        onValueChange={onValueChange}
        declarations={() => context?.declarations() ?? []}
        variables={context?.variables}
        label={messages.buttonLabel}
        placeholder={messages.buttonLabel}
        readOnly={readOnly}
        messages={messages}
        className="min-w-16 text-center"
      />
    </span>
  );
}
