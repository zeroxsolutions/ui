import registry from '../../registry.json';

/** The origin the registry is served from, which its items name each other by and the sitemap lists pages at. */
export const registryHomepage = registry.homepage;

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
