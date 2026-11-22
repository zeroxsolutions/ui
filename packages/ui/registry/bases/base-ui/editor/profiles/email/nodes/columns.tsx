import type { CSSProperties, ReactNode } from 'react';
import { LayoutGridIcon } from '@/registry/bases/base-ui/icons/lucide/layout-grid-icon';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../../messages';
import { blockClasses, emailSpec, type EmailBlockStyle } from './block-style';

interface EmailColumnsAttrs extends EmailBlockStyle {
  ratio?: number[] | null;
}

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

// The lanes are the content element's children, so the grid is drawn on it in `styles.css`; an absent ratio
// leaves the lanes equal.
function EmailColumnsView({ attrs, children }: NodeViewProps<EmailColumnsAttrs>) {
  const ratio = attrs.ratio && attrs.ratio.length > 0 ? attrs.ratio : null;
  const style = ratio
    ? ({ '--email-columns': ratio.map((share) => `minmax(0, ${share}fr)`).join(' ') } as CSSProperties)
    : undefined;
  return (
    <div data-slot="email-columns" style={style} className={blockClasses(attrs)}>
      {children as ReactNode}
    </div>
  );
}

function EmailLaneView({ children }: NodeViewProps) {
  return (
    <div data-slot="email-lane" className="h-full min-w-0 border border-dashed p-2">
      {children as ReactNode}
    </div>
  );
}

/**
 * The columns block and its lanes. `laneContent` names the blocks a lane may hold: the profile's kinds but
 * columns, so a lane never nests another columns block.
 */
export function emailColumnsNodes(laneContent: string): NodeSpec[] {
  return [
    { ...emailSpec('emailColumns'), render: EmailColumnsView },
    { ...emailSpec('emailLane'), content: laneContent, render: EmailLaneView },
  ];
}
