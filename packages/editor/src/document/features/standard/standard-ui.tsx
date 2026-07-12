import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Strikethrough,
  TextQuote,
  Underline,
} from 'lucide-react';
import type { BubbleItem, SlashItem, ToolbarItem } from '../../core/index.js';

/** Slash-menu insert items for the standard blocks. */
export const standardSlashItems: SlashItem[] = [
  { id: 'h1', title: 'Heading 1', group: 'Basic', icon: <Heading1 className="size-4" />, keywords: ['h1', 'title'], command: 'toggleHeading', args: { level: 1 } },
  { id: 'h2', title: 'Heading 2', group: 'Basic', icon: <Heading2 className="size-4" />, keywords: ['h2', 'subtitle'], command: 'toggleHeading', args: { level: 2 } },
  { id: 'h3', title: 'Heading 3', group: 'Basic', icon: <Heading3 className="size-4" />, keywords: ['h3'], command: 'toggleHeading', args: { level: 3 } },
  { id: 'bulletList', title: 'Bullet list', group: 'Basic', icon: <List className="size-4" />, keywords: ['ul', 'unordered', 'list'], command: 'toggleBulletList' },
  { id: 'orderedList', title: 'Numbered list', group: 'Basic', icon: <ListOrdered className="size-4" />, keywords: ['ol', 'ordered', 'number'], command: 'toggleOrderedList' },
  { id: 'taskList', title: 'To-do list', group: 'Basic', icon: <ListTodo className="size-4" />, keywords: ['task', 'todo', 'checkbox'], command: 'toggleTaskList' },
  { id: 'blockquote', title: 'Quote', group: 'Basic', icon: <TextQuote className="size-4" />, keywords: ['quote', 'blockquote'], command: 'toggleBlockquote' },
  { id: 'divider', title: 'Divider', group: 'Basic', icon: <Minus className="size-4" />, keywords: ['hr', 'rule', 'divider', 'separator'], command: 'setHorizontalRule' },
];

/** Toolbar/bubble formatting buttons for the standard marks. */
export const standardToolbarItems: ToolbarItem[] = [
  { id: 'bold', title: 'Bold', icon: <Bold className="size-4" />, command: 'toggleMark', args: { name: 'bold' }, activeWhen: 'bold' },
  { id: 'italic', title: 'Italic', icon: <Italic className="size-4" />, command: 'toggleMark', args: { name: 'italic' }, activeWhen: 'italic' },
  { id: 'underline', title: 'Underline', icon: <Underline className="size-4" />, command: 'toggleMark', args: { name: 'underline' }, activeWhen: 'underline' },
  { id: 'strike', title: 'Strikethrough', icon: <Strikethrough className="size-4" />, command: 'toggleMark', args: { name: 'strike' }, activeWhen: 'strike' },
  { id: 'code', title: 'Inline code', icon: <Code className="size-4" />, command: 'toggleMark', args: { name: 'code' }, activeWhen: 'code' },
  { id: 'highlight', title: 'Highlight', icon: <Highlighter className="size-4" />, command: 'toggleMark', args: { name: 'highlight' }, activeWhen: 'highlight' },
];

export const standardBubbleItems: BubbleItem[] = standardToolbarItems;
