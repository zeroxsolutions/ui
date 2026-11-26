import { LetterBIcon } from '@/registry/bases/base-ui/icons/lucide/letter-b-icon';
import { CodeIcon } from '@/registry/bases/base-ui/icons/lucide/code-icon';
import { Heading1Icon } from '@/registry/bases/base-ui/icons/lucide/heading-1-icon';
import { Heading2Icon } from '@/registry/bases/base-ui/icons/lucide/heading-2-icon';
import { Heading3Icon } from '@/registry/bases/base-ui/icons/lucide/heading-3-icon';
import { HighlighterIcon } from '@/registry/bases/base-ui/icons/lucide/highlighter-icon';
import { ItalicIcon } from '@/registry/bases/base-ui/icons/lucide/italic-icon';
import { ListIcon } from '@/registry/bases/base-ui/icons/lucide/list-icon';
import { ListOrderedIcon } from '@/registry/bases/base-ui/icons/lucide/list-ordered-icon';
import { ListTodoIcon } from '@/registry/bases/base-ui/icons/lucide/list-todo-icon';
import { MinusIcon } from '@/registry/bases/base-ui/icons/lucide/minus-icon';
import { StrikethroughIcon } from '@/registry/bases/base-ui/icons/lucide/strikethrough-icon';
import { TextQuoteIcon } from '@/registry/bases/base-ui/icons/lucide/text-quote-icon';
import { UnderlineIcon } from '@/registry/bases/base-ui/icons/lucide/underline-icon';
import { CopyIcon } from '@/registry/bases/base-ui/icons/lucide/copy-icon';
import { PaletteIcon } from '@/registry/bases/base-ui/icons/lucide/palette-icon';
import { TrashIcon } from '@/registry/bases/base-ui/icons/lucide/trash-icon';
import type {
  BlockMenuItem,
  BubbleItem,
  IEditor,
  SlashItem,
  ToolbarItem,
} from '@zeroxsolutions/editor-core/document/core/index';
import { PARAGRAPH_SIZES } from '@zeroxsolutions/editor-core/template/layout/index';
import { DEFAULT_LAYOUT_WORDS, type LayoutWords } from '../../layout/layout-words';
import type { BubbleMenuControlArgs } from '../../ui/bubble-menu';

/** Slash-menu insert items for the standard blocks. */
export const standardSlashItems: SlashItem[] = [
  {
    id: 'h1',
    title: 'Heading 1',
    group: 'Basic',
    icon: Heading1Icon,
    keywords: ['h1', 'title'],
    command: 'toggleHeading',
    args: { level: 1 },
  },
  {
    id: 'h2',
    title: 'Heading 2',
    group: 'Basic',
    icon: Heading2Icon,
    keywords: ['h2', 'subtitle'],
    command: 'toggleHeading',
    args: { level: 2 },
  },
  {
    id: 'h3',
    title: 'Heading 3',
    group: 'Basic',
    icon: Heading3Icon,
    keywords: ['h3'],
    command: 'toggleHeading',
    args: { level: 3 },
  },
  {
    id: 'bulletList',
    title: 'Bullet list',
    group: 'Basic',
    icon: ListIcon,
    keywords: ['ul', 'unordered', 'list'],
    command: 'toggleBulletList',
  },
  {
    id: 'orderedList',
    title: 'Numbered list',
    group: 'Basic',
    icon: ListOrderedIcon,
    keywords: ['ol', 'ordered', 'number'],
    command: 'toggleOrderedList',
  },
  {
    id: 'taskList',
    title: 'To-do list',
    group: 'Basic',
    icon: ListTodoIcon,
    keywords: ['task', 'todo', 'checkbox'],
    command: 'toggleTaskList',
  },
  {
    id: 'blockquote',
    title: 'Quote',
    group: 'Basic',
    icon: TextQuoteIcon,
    keywords: ['quote', 'blockquote'],
    command: 'toggleBlockquote',
  },
  {
    id: 'divider',
    title: 'Divider',
    group: 'Basic',
    icon: MinusIcon,
    keywords: ['hr', 'rule', 'divider', 'separator'],
    command: 'setHorizontalRule',
  },
];

/** Toolbar/bubble formatting buttons for the standard marks. */
export const standardToolbarItems: ToolbarItem[] = [
  {
    id: 'bold',
    title: 'Bold',
    icon: LetterBIcon,
    command: 'toggleMark',
    args: { name: 'bold' },
    activeWhen: 'bold',
  },
  {
    id: 'italic',
    title: 'Italic',
    icon: ItalicIcon,
    command: 'toggleMark',
    args: { name: 'italic' },
    activeWhen: 'italic',
  },
  {
    id: 'underline',
    title: 'Underline',
    icon: UnderlineIcon,
    command: 'toggleMark',
    args: { name: 'underline' },
    activeWhen: 'underline',
  },
  {
    id: 'strike',
    title: 'Strikethrough',
    icon: StrikethroughIcon,
    command: 'toggleMark',
    args: { name: 'strike' },
    activeWhen: 'strike',
  },
  {
    id: 'code',
    title: 'Inline code',
    icon: CodeIcon,
    command: 'toggleMark',
    args: { name: 'code' },
    activeWhen: 'code',
  },
  {
    id: 'highlight',
    title: 'Highlight',
    icon: HighlighterIcon,
    command: 'toggleMark',
    args: { name: 'highlight' },
    activeWhen: 'highlight',
  },
];

/** The id of the bubble's text alignment group. */
export const TEXT_ALIGN_ITEM_ID = 'text-align';

/** The id of the bubble's item that opens the text and background colour menu. */
export const TEXT_COLOR_ITEM_ID = 'text-color';

/**
 * The bubble's text styling in `words`: the alignment group and the colour menu, which `BubbleMenu` draws from
 * their commands (`BubbleMenuControlArgs`).
 */
export function textStyleBubbleItems(words: LayoutWords = DEFAULT_LAYOUT_WORDS): BubbleItem[] {
  const args: BubbleMenuControlArgs = { words };
  return [
    { id: TEXT_ALIGN_ITEM_ID, title: words.textAlign, command: 'setTextAlign', args },
    { id: TEXT_COLOR_ITEM_ID, title: words.textColor, icon: PaletteIcon, command: 'setTextColor', args },
  ];
}

export const standardBubbleItems: BubbleItem[] = [...standardToolbarItems, ...textStyleBubbleItems()];

const turnInto = (id: string, title: string, node: string, attrs?: Record<string, unknown>): BlockMenuItem => ({
  id: `turn-into-${id}`,
  title,
  group: 'Turn into',
  command: 'turnBlockInto',
  args: { name: node, attrs },
  // Offered only on a block of text, which is the only kind `turnBlockInto` rewrites without loss.
  visible: (editor) => editor.can('turnBlockInto', { name: node, attrs }),
  active: (editor) => editor.isActive(node, attrs),
});

const isSized = (editor: IEditor) => PARAGRAPH_SIZES.some((size) => editor.isActive('paragraph', { size }));

/** The plain line: a lead or a small one turned into it loses its size, which turning would otherwise keep. */
const turnIntoText: BlockMenuItem = {
  ...turnInto('text', 'Text', 'paragraph', { size: null }),
  active: (editor) => editor.isActive('paragraph') && !isSized(editor),
};

/** The grip menu of the standard blocks: turn the block into another, copy it, remove it. */
export const standardBlockMenuItems: BlockMenuItem[] = [
  turnIntoText,
  ...PARAGRAPH_SIZES.map((size) => turnInto(size, DEFAULT_LAYOUT_WORDS.paragraphSizes[size], 'paragraph', { size })),
  turnInto('heading-1', 'Heading 1', 'heading', { level: 1 }),
  turnInto('heading-2', 'Heading 2', 'heading', { level: 2 }),
  turnInto('heading-3', 'Heading 3', 'heading', { level: 3 }),
  turnInto('bulleted-list', 'Bulleted list', 'bulletList'),
  turnInto('numbered-list', 'Numbered list', 'orderedList'),
  turnInto('to-do-list', 'To-do list', 'taskList'),
  turnInto('quote', 'Quote', 'blockquote'),
  { id: 'duplicate', title: 'Duplicate', icon: CopyIcon, command: 'duplicateBlock' },
  { id: 'delete', title: 'Delete', icon: TrashIcon, command: 'deleteBlock', destructive: true, separatorBefore: true },
];
