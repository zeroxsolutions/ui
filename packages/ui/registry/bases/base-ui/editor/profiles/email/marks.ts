import { createElement } from 'react';
import { UnlinkIcon } from 'lucide-react';
import { z } from 'zod';
import { LinkIcon } from '@/registry/bases/base-ui/icons/lucide/link-icon';
import {
  defineFeature,
  type EditorFeature,
  type MarkSpec,
  type ToolbarItem,
} from '@zeroxsolutions/editor-core/document/core/index';
import { emailNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';

const LINK_CLASS = 'text-primary underline underline-offset-2';

/** The id of the toolbar's and the bubble's item that opens the link popover on the selection. */
export const LINK_ITEM_ID = 'email-link';

/** The id of the bubble's item that removes the link the selection is in. */
export const UNLINK_ITEM_ID = 'email-unlink';

const linkItem: ToolbarItem = {
  id: LINK_ITEM_ID,
  title: DEFAULT_PROFILE_MESSAGES.link,
  icon: LinkIcon,
  // The email kit's command, which a link popover the host draws answers.
  command: 'editEmailLink',
  activeWhen: 'emailLink',
};

// Bubble only, as the document's own link is: the toolbar's link item opens the popover, which removes it too.
const unlinkItem: ToolbarItem = {
  id: UNLINK_ITEM_ID,
  title: DEFAULT_PROFILE_MESSAGES.removeLink,
  icon: createElement(UnlinkIcon, { 'aria-hidden': true }),
  // The email kit's command: a caret inside a link removes the whole link.
  command: 'unsetEmailLink',
  activeWhen: 'emailLink',
};

/**
 * The email text's link, to an href that may hold `{{name}}` tokens, beside the document's own bold and italic:
 * the three marks the inline markup stores. A code or html block and a button label carry none.
 */
export function emailMarks(): EditorFeature {
  return defineFeature({
    id: 'emailMarks',
    marks: emailNodeSpecs.marks.map((mark): MarkSpec => ({ ...mark, className: LINK_CLASS })),
    commands: {
      setEmailLink: {
        args: z.object({ href: z.string().trim().min(1) }),
        run: (editor, { href }: { href: string }) => editor.run('setMark', { name: 'emailLink', attrs: { href } }),
      },
    },
    toolbar: [linkItem],
    bubble: [linkItem, unlinkItem],
  });
}
