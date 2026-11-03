import type { ComponentProps, ReactNode } from 'react';

import { HostLink } from '@zeroxsolutions/ui/site/components/navigation/host-link';
import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import { cn } from '@zeroxsolutions/ui/registry/bases/base-ui/lib/utils';

import { publishedItems } from '../../lib/published-items';
import { componentRoute, docsPageRoute } from '../../routes';

/** A category as a heading: `data-display` reads `Data display`. */
function categoryLabel(category: string): string {
  const words = category.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface ComponentsListProps extends ComponentProps<'div'> {
  /** `href`, a docs URL a route built, where the docs have a page there; `undefined` where none is written yet. */
  writtenDocsPage(href: string): string | undefined;
}

/**
 * Every component and block the registry publishes, under its category in `registry.json`'s order. An
 * item with a docs page links to it; the rest are listed by title until theirs is written.
 */
function ComponentsList({ writtenDocsPage, className, ...props }: ComponentsListProps): ReactNode {
  return (
    <div data-slot="components-list" className={cn('flex flex-col gap-8', className)} {...props}>
      {[...Map.groupBy(publishedItems, (item) => item.category)].map(([category, items]) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{categoryLabel(category)}</h2>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {items.map((item) => {
              const url =
                item.type === 'registry:block'
                  ? writtenDocsPage(docsPageRoute.build({ slug: `blocks/${item.name}` }))
                  : writtenDocsPage(componentRoute.build({ base: DEFAULT_COMPONENT_BASE, name: item.name }));
              return (
                <li key={item.name} className="flex flex-col gap-1">
                  {url ? (
                    <HostLink href={url} className="font-medium underline underline-offset-4">
                      {item.title}
                    </HostLink>
                  ) : (
                    <span className="font-medium">{item.title}</span>
                  )}
                  <span className="text-muted-foreground text-sm">{item.description}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export { ComponentsList };
