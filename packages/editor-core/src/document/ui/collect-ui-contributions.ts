import type {
  BlockMenuItem,
  BubbleItem,
  EditorFeature,
  SlashItem,
  ToolbarItem,
} from '../core/index.js';

/**
 * Aggregate the declarative UI contributions across a feature set so the chrome
 * (slash / toolbar / bubble / block menu) renders them from one place (see
 * `editor-feature-api`). Every item refers to a command **by name** and holds no
 * engine reference — the chrome dispatches through the `IEditor` façade, so this
 * whole module is engine-free.
 */
export interface UiContributions {
  slash: SlashItem[];
  toolbar: ToolbarItem[];
  bubble: BubbleItem[];
  blockMenu: BlockMenuItem[];
}

export function collectUiContributions(
  features: EditorFeature[],
): UiContributions {
  const contributions: UiContributions = {
    slash: [],
    toolbar: [],
    bubble: [],
    blockMenu: [],
  };
  for (const feature of features) {
    if (feature.slash) contributions.slash.push(...feature.slash);
    if (feature.toolbar) contributions.toolbar.push(...feature.toolbar);
    if (feature.bubble) contributions.bubble.push(...feature.bubble);
    if (feature.blockMenu) contributions.blockMenu.push(...feature.blockMenu);
  }
  return contributions;
}

/** Filter slash items by a query against title + keywords (pure; the live cmdk
 *  palette filters too, but a non-cmdk consumer can use this directly). */
export function filterSlashItems(
  items: SlashItem[],
  query: string,
): SlashItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      (item.keywords ?? []).some((keyword) =>
        keyword.toLowerCase().includes(needle),
      ),
  );
}

/** Group items by their `group` heading, preserving insertion order. */
export function groupByHeading<T extends { group?: string }>(
  items: T[],
  fallback = 'Blocks',
): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.group ?? fallback;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(item);
  }
  return [...groups.entries()];
}

/** Standard "turn into / delete" block-menu actions every editor offers, on top
 *  of any a feature contributes. `setParagraph` / `deleteSelection` are built-in;
 *  `toggleHeading` needs the standard kit. */
export const defaultBlockMenuItems: BlockMenuItem[] = [
  { id: 'turn-paragraph', title: 'Text', command: 'setParagraph' },
  {
    id: 'turn-h1',
    title: 'Heading 1',
    command: 'toggleHeading',
    args: { level: 1 },
  },
  {
    id: 'turn-h2',
    title: 'Heading 2',
    command: 'toggleHeading',
    args: { level: 2 },
  },
  {
    id: 'delete',
    title: 'Delete',
    command: 'deleteSelection',
    separatorBefore: true,
  },
];
