'use client';

import { TreeItem } from '@zeroxsolutions/ui/components/tree-item';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/**
 * Authored from `TreeItemProps` (+ the `TreeIndentProps` it spreads). The
 * meaningful surface a row touches; inherited div props are summarised.
 */
const TREE_ITEM_PROPS: PropEntry[] = [
  {
    name: 'name',
    type: 'string',
    default: '-',
    description: 'Display name; shown unless rename.editing is true.',
  },
  {
    name: 'depth',
    type: 'number',
    default: '-',
    description: 'Nesting depth - 0 for roots. Drives the left indent via TreeIndent.',
  },
  {
    name: 'hasChildren',
    type: 'boolean',
    default: '-',
    description: 'Whether the node has children - shows the chevron vs. a spacer.',
  },
  {
    name: 'expanded',
    type: 'boolean',
    default: '-',
    description: 'Whether the node is expanded - rotates the chevron and sets the a11y label.',
  },
  {
    name: 'onToggleExpand',
    type: '() => void',
    default: '-',
    description: 'Toggle expand/collapse. The chevron stops propagation so it never selects.',
  },
  {
    name: 'icon',
    type: 'ReactNode',
    default: '-',
    description: 'Leading icon (node/kind icon).',
  },
  {
    name: 'onActivate',
    type: '(event: MouseEvent) => void',
    default: '-',
    description: 'Click on the name region. Raw event so callers can read shift/meta keys.',
  },
  {
    name: 'rename',
    type: 'TreeItemRename',
    default: '-',
    description:
      'Inline-rename wiring (editing, draft, onCommit, onCancel, inputRef). Omit when the row is not renamable.',
  },
  {
    name: 'inlineEnd',
    type: 'ReactNode',
    default: '-',
    description: 'Badges shown after the name, inside the clickable area.',
  },
  {
    name: 'trailing',
    type: 'ReactNode',
    default: '-',
    description: 'Trailing actions (visibility / lock). The caller owns hover/opacity classes.',
  },
  {
    name: 'contextMenuContent',
    type: 'ReactNode',
    default: '-',
    description: 'A <ContextMenuContent> block. When set, the row is wrapped in a ContextMenu.',
  },
];

/**
 * TreeItem composes TreeIndent internally, but the consumer surface is one
 * component - so the tree is a single line, like Button's leaf treatment.
 */
const TREE_ITEM_COMPOSITION: CompositionNode = {
  name: 'TreeItem',
  slot: 'Root',
};

/**
 * Doc page for `TreeItem`. The Preview keeps the live render `renames.spec.ts`
 * reads (rows carrying data-slot="tree-item"); this retrofit adds Code/Props/
 * Composition around it without touching the component.
 */
export default function TreePreviewPage() {
  return (
    <DocPage
      title="TreeItem"
      description="One row of a hierarchy tree - the layer above TreeIndent. Owns the clickable name region, inline-rename, trailing actions, and an optional context menu; TreeIndent owns the indent + disclosure chevron."
      preview={
        <ComponentPreview>
          <div className="flex w-full flex-col gap-1">
            <TreeItem
              depth={0}
              hasChildren
              expanded
              onToggleExpand={() => {}}
              name="src"
            />
            <TreeItem
              depth={1}
              hasChildren={false}
              expanded={false}
              onToggleExpand={() => {}}
              name="index.ts"
            />
            <TreeItem
              depth={1}
              hasChildren={false}
              expanded={false}
              onToggleExpand={() => {}}
              name="page.tsx"
            />
          </div>
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="tree-item"
          importPath="components/tree-item"
          exportedAs="TreeItem"
        />
      }
      propsTable={<PropsTable rows={TREE_ITEM_PROPS} />}
      composition={<CompositionTree tree={TREE_ITEM_COMPOSITION} />}
    />
  );
}
