import { createElement } from 'react';
import { UnlinkIcon } from 'lucide-react';
import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type MarkSpec,
  type ToolbarItem,
} from '@zeroxsolutions/editor-core/document/core/index';
import { emailNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';

const LINK_CLASS = 'text-primary underline underline-offset-2';

/** The id of the bubble's item that removes the link the selection is in. */
export const UNLINK_ITEM_ID = 'email-unlink';

// Bubble only, as the document's own link is: the toolbar row ends with the link picker.
const unlinkItem: ToolbarItem = {
  id: UNLINK_ITEM_ID,
  title: DEFAULT_PROFILE_MESSAGES.removeLink,
  icon: createElement(UnlinkIcon, { 'aria-hidden': true }),
  // The email kit's command: a caret inside a link removes the whole link.
  command: 'unsetEmailLink',
  activeWhen: 'emailLink',
};

/**
 * The email text's link to one declared `url` variable, beside the document's own bold and italic: the three
 * marks the inline markup stores. A code or html block and a button label carry none.
 */
export function emailMarks(): EditorFeature {
  return defineFeature({
    id: 'emailMarks',
    marks: emailNodeSpecs.marks
      .filter((mark) => mark.name === 'emailLink')
      .map((mark): MarkSpec => ({ ...mark, className: LINK_CLASS })),
    commands: {
      toggleBold: {
        run: (editor) => editor.run('toggleMark', { name: 'bold' }),
        can: (editor) => editor.can('toggleMark', { name: 'bold' }),
      },
      toggleItalic: {
        run: (editor) => editor.run('toggleMark', { name: 'italic' }),
        can: (editor) => editor.can('toggleMark', { name: 'italic' }),
      },
      setEmailLink: {
        args: z.object({ variable: z.string().regex(/^\w+$/) }),
        run: (editor, { variable }: { variable: string }) =>
          editor.run('setMark', { name: 'emailLink', attrs: { variable } }),
      },
    },
    bubble: [unlinkItem],
  });
}
