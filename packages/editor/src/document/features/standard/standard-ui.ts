import type { BubbleItem, SlashItem, ToolbarItem } from '../../core/index.js';

/** Slash-menu insert items for the standard blocks. */
export const standardSlashItems: SlashItem[] = [
  { id: 'h1', title: 'Heading 1', group: 'Basic', keywords: ['h1', 'title'], command: 'toggleHeading', args: { level: 1 } },
  { id: 'h2', title: 'Heading 2', group: 'Basic', keywords: ['h2', 'subtitle'], command: 'toggleHeading', args: { level: 2 } },
  { id: 'h3', title: 'Heading 3', group: 'Basic', keywords: ['h3'], command: 'toggleHeading', args: { level: 3 } },
  { id: 'bulletList', title: 'Bullet list', group: 'Basic', keywords: ['ul', 'unordered', 'list'], command: 'toggleBulletList' },
  { id: 'orderedList', title: 'Numbered list', group: 'Basic', keywords: ['ol', 'ordered', 'number'], command: 'toggleOrderedList' },
  { id: 'taskList', title: 'To-do list', group: 'Basic', keywords: ['task', 'todo', 'checkbox'], command: 'toggleTaskList' },
  { id: 'blockquote', title: 'Quote', group: 'Basic', keywords: ['quote', 'blockquote'], command: 'toggleBlockquote' },
  { id: 'divider', title: 'Divider', group: 'Basic', keywords: ['hr', 'rule', 'divider', 'separator'], command: 'setHorizontalRule' },
];

/** Toolbar/bubble formatting buttons for the standard marks. */
export const standardToolbarItems: ToolbarItem[] = [
  { id: 'bold', title: 'Bold', command: 'toggleMark', args: { name: 'bold' }, activeWhen: 'bold' },
  { id: 'italic', title: 'Italic', command: 'toggleMark', args: { name: 'italic' }, activeWhen: 'italic' },
  { id: 'underline', title: 'Underline', command: 'toggleMark', args: { name: 'underline' }, activeWhen: 'underline' },
  { id: 'strike', title: 'Strikethrough', command: 'toggleMark', args: { name: 'strike' }, activeWhen: 'strike' },
  { id: 'code', title: 'Inline code', command: 'toggleMark', args: { name: 'code' }, activeWhen: 'code' },
  { id: 'highlight', title: 'Highlight', command: 'toggleMark', args: { name: 'highlight' }, activeWhen: 'highlight' },
];

export const standardBubbleItems: BubbleItem[] = standardToolbarItems;
