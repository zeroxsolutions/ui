import type { ReactNode } from 'react';

/**
 * UI a feature contributes to the editor chrome (see the `editor-feature-api`
 * spec). Each item is declarative and refers to a command **by name** — it holds
 * no engine reference. The chrome (slash/bubble/toolbar/block menus) renders
 * these from the house design system (`@zeroxsolutions/ui`).
 */

/** An item in the slash (`/`) insert menu. */
export interface SlashItem {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Search terms that match this item. */
  keywords?: string[];
  /** Group heading the item appears under. */
  group?: string;
  /** Command run on select, by name. */
  command: string;
  /** Arguments passed to the command (validated at dispatch). */
  args?: unknown;
}

/** A button in the fixed/inline toolbar or the selection bubble. */
export interface ToolbarItem {
  id: string;
  title: string;
  icon?: ReactNode;
  command: string;
  args?: unknown;
  /** Mark/node name whose active state the button reflects. */
  activeWhen?: string;
}

/** A selection-bubble item (same shape as a toolbar item). */
export type BubbleItem = ToolbarItem;

/** An entry in a block's drag-handle menu (turn-into, duplicate, delete, …). */
export interface BlockMenuItem {
  id: string;
  title: string;
  icon?: ReactNode;
  command: string;
  args?: unknown;
  /** Renders a divider before this item. */
  separatorBefore?: boolean;
}
