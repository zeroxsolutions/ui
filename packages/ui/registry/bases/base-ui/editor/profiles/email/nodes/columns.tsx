import type { CSSProperties, ReactNode } from 'react';
import { LayoutGridIcon } from '@/registry/bases/base-ui/icons/lucide/layout-grid-icon';
import type { NodeSpec, NodeViewProps, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';
import type { ReactNodeCodec } from '../../../react-types';
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
function EmailColumnsShell({ attrs, children }: { attrs: EmailColumnsAttrs; children: ReactNode }) {
  const ratio = attrs.ratio && attrs.ratio.length > 0 ? attrs.ratio : null;
  const style = ratio
    ? ({ '--email-columns': ratio.map((share) => `minmax(0, ${share}fr)`).join(' ') } as CSSProperties)
    : undefined;
  return (
    <div data-slot="email-columns" style={style} className={blockClasses(attrs)}>
      {children}
    </div>
  );
}

function EmailLaneShell({ children }: { children: ReactNode }) {
  return (
    <div data-slot="email-lane" className="h-full min-w-0 border border-dashed p-2">
      {children}
    </div>
  );
}

function EmailColumnsView({ attrs, children }: NodeViewProps<EmailColumnsAttrs>) {
  return <EmailColumnsShell attrs={attrs}>{children as ReactNode}</EmailColumnsShell>;
}

function EmailLaneView({ children }: NodeViewProps) {
  return <EmailLaneShell>{children as ReactNode}</EmailLaneShell>;
}

/** Children wrapped as the engine wraps a view's content, which the rules in `styles.css` select. */
function EmailColumnsContent({ children }: { children: ReactNode }) {
  return (
    <div data-node-view-content="">
      <div data-node-view-content-react="">{children}</div>
    </div>
  );
}

/** The columns and their lanes as the document is drawn before the editor mounts. */
export const emailColumnsCodecs: ReactNodeCodec[] = [
  {
    node: 'emailColumns',
    toReact: (node, ctx) => (
      <EmailColumnsShell attrs={node.attrs ?? {}}>
        <EmailColumnsContent>{ctx.renderChildren(node)}</EmailColumnsContent>
      </EmailColumnsShell>
    ),
  },
  {
    node: 'emailLane',
    toReact: (node, ctx) => (
      <EmailLaneShell>
        <EmailColumnsContent>{ctx.renderChildren(node)}</EmailColumnsContent>
      </EmailLaneShell>
    ),
  },
];

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
