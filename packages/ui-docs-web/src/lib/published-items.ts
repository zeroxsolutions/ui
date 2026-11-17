import registry from '@zeroxsolutions/ui/registry.json';
import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import { iconSets } from '@zeroxsolutions/ui/site/lib/icon-sets';
import type { ComponentBase } from '@zeroxsolutions/ui/site/types/component-base';

/** A component or block `registry.json` publishes, as the docs list it. */
export interface PublishedItem {
  name: string;
  type: 'registry:component' | 'registry:block';
  title: string;
  description: string;
  /** The kind folder the item's family file sits in, or `blocks`. */
  category: string;
}

/** Every component and block the registry publishes, in `registry.json`'s order; the demos are left out. */
export const publishedItems: PublishedItem[] = registry.items.flatMap((item) =>
  item.type === 'registry:component' || item.type === 'registry:block'
    ? [
        {
          name: item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          category: item.categories?.[0] ?? '',
        },
      ]
    : [],
);

/** The blocks the registry publishes, each of which `/view/<name>` renders alone. */
export const publishedBlocks = publishedItems.filter((item) => item.type === 'registry:block');

/** The animated icons the registry publishes, by set, which the icons page shows. */
export const publishedIconSets = iconSets(registry.items);

/**
 * The bases the icons page is built for. The icons are drawn on the default base alone, so a base added
 * to the registry gets an icons page only once its own icons exist.
 */
export const publishedIconBases: readonly ComponentBase[] = [DEFAULT_COMPONENT_BASE];
