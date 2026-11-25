import { LayoutGridIcon } from '@/registry/bases/base-ui/icons/lucide/layout-grid-icon';
import type { SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';

export const emailColumnsSlashItem: SlashItem = {
  id: 'email-columns',
  title: DEFAULT_PROFILE_MESSAGES.blocks.columns.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.columns.description,
  icon: LayoutGridIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['columns', 'lanes', 'side by side'],
  command: 'insertEmailBlock',
  args: { kind: 'columns' },
};
