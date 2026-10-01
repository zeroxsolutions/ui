import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { publishedItems } from '@/lib/registry';
import { source } from '@/lib/source';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** A category as a heading: `data-display` reads `Data display`. */
function categoryLabel(category: string): string {
  const words = category.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Every component and block the registry publishes, under its category in `registry.json`'s order. An
 * item with a docs page links to it; the rest are listed by title until theirs is written.
 */
function ComponentsList({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="components-list" className={cn('flex flex-col gap-8', className)} {...props}>
      {[...Map.groupBy(publishedItems, (item) => item.category)].map(([category, items]) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{categoryLabel(category)}</h2>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {items.map((item) => {
              const page = source.getPage([item.type === 'registry:block' ? 'blocks' : 'components', item.name]);
              return (
                <li key={item.name} className="flex flex-col gap-1">
                  {page ? (
                    <Link href={page.url} className="font-medium underline underline-offset-4">
                      {item.title}
                    </Link>
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
