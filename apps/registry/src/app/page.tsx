import Link from 'next/link';

import { Badge } from '@zeroxsolutions/ui/components/ui/badge';

interface CatalogEntry {
  name: string;
  href: string;
  type: string;
  category: string;
}

/**
 * The catalog index (Decision 3): items grouped by `category` and labeled by
 * `type`. Seeded for now with the items that have a live preview page; later
 * clusters source this from `registry.json` once items carry a `category`.
 */
const CATALOG: CatalogEntry[] = [
  {
    name: 'Button',
    href: '/preview/button',
    type: 'registry:ui',
    category: 'primitives',
  },
  {
    name: 'SplitButton',
    href: '/preview/split-button',
    type: 'registry:component',
    category: 'components',
  },
  {
    name: 'MenuButton',
    href: '/preview/menu-button',
    type: 'registry:component',
    category: 'components',
  },
  {
    name: 'ChatMessage',
    href: '/preview/chat-message',
    type: 'registry:component',
    category: 'data-display',
  },
  {
    name: 'TreeItem',
    href: '/preview/tree',
    type: 'registry:component',
    category: 'data-display',
  },
  {
    name: 'FieldGroup',
    href: '/preview/field-group',
    type: 'registry:component',
    category: 'layout',
  },
];

const CATEGORY_ORDER = [
  'primitives',
  'components',
  'layout',
  'data-display',
  'editor',
  'blocks',
  'pages',
] as const;

/**
 * The registry app index: a catalog of items grouped by `category` and labeled
 * by `type`, linking into each item's preview/doc page; the shadcn-compatible
 * registry is served as static JSON under `/r/<name>.json`.
 */
export default function HomePage() {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: CATALOG.filter((item) => item.category === category),
  })).filter(({ items }) => items.length > 0);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold">@zeroxsolutions/ui registry</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Isolated component previews and the shadcn-compatible registry, served
        as static JSON under <code>/r/&lt;name&gt;.json</code>.
      </p>
      <div className="flex flex-col gap-6">
        {groups.map(({ category, items }) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {category}
            </h2>
            <ul className="flex flex-col divide-y rounded-lg border">
              {items.map(({ name, href, type }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span>{name}</span>
                    <Badge variant="outline">{type}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
