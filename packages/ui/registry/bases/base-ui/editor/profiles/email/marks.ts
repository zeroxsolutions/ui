import { createElement } from 'react';
import { UnlinkIcon } from 'lucide-react';
import { z } from 'zod';
import { ItalicIcon } from '@/registry/bases/base-ui/icons/lucide/italic-icon';
import { LetterBIcon } from '@/registry/bases/base-ui/icons/lucide/letter-b-icon';
import {
  defineFeature,
  type EditorFeature,
  type MarkSpec,
  type ToolbarItem,
} from '@zeroxsolutions/editor-core/document/core/index';
import { emailNodeSpecs } from '@zeroxsolutions/editor-core/profiles/index';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';

const MARK_CLASSES: Record<string, string> = { emailLink: 'text-primary underline underline-offset-2' };

const markItems: ToolbarItem[] = [
  {
    id: 'email-bold',
    title: DEFAULT_PROFILE_MESSAGES.bold,
    icon: LetterBIcon,
    command: 'toggleBold',
    activeWhen: 'bold',
  },
  {
    id: 'email-italic',
    title: DEFAULT_PROFILE_MESSAGES.italic,
    icon: ItalicIcon,
    command: 'toggleItalic',
    activeWhen: 'italic',
  },
  {
    id: 'email-unlink',
    title: DEFAULT_PROFILE_MESSAGES.removeLink,
    icon: createElement(UnlinkIcon, { 'aria-hidden': true }),
    // The email kit's command: a caret inside a link removes the whole link.
    command: 'unsetEmailLink',
    activeWhen: 'emailLink',
  },
];

/**
 * The email text's marks: bold, italic and a link to one declared `url` variable, the three the inline markup
 * stores. A code or html block and a button label carry none.
 */
export function emailMarks(): EditorFeature {
  return defineFeature({
    id: 'emailMarks',
    marks: emailNodeSpecs.marks.map((mark): MarkSpec =>
      MARK_CLASSES[mark.name] ? { ...mark, className: MARK_CLASSES[mark.name] } : mark,
    ),
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
    shortcuts: { 'Mod-b': 'toggleBold', 'Mod-i': 'toggleItalic' },
    toolbar: markItems,
    bubble: markItems,
  });
}
