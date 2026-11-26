import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import type { EditorFeature, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { EMAIL_SECTION_WIDTHS } from '@zeroxsolutions/editor-core/template/email/index';
import { section } from '../../../document/features/section/index';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../../messages';

export const emailSectionSlashItem: SlashItem = {
  id: 'email-section',
  title: DEFAULT_PROFILE_MESSAGES.blocks.section.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.section.description,
  icon: LayoutPanelTopIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['section', 'background', 'band', 'layout'],
  command: 'insertEmailBlock',
  args: { kind: 'section' },
};

/**
 * The Document Editor's section in the email editor: its toolbar in `messages`' layout words, offering the widths an
 * email draws, content and wide. It is inserted through the kit's own command, which checks the profile, a locked
 * structure and where the caret is.
 */
export function emailSection(messages: () => ProfileEditorMessages): EditorFeature {
  return {
    ...section({ messages: () => messages().layout, widths: EMAIL_SECTION_WIDTHS }),
    slash: [emailSectionSlashItem],
    commands: {},
  };
}
