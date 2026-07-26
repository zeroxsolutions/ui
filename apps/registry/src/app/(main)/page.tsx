import Link from 'next/link';
import { ArrowRight, Blocks, BookOpen, Layers } from 'lucide-react';

import { Badge } from '@zeroxsolutions/ui/components/ui/badge';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@zeroxsolutions/ui/components/ui/card';

import { AnimatedBackdrop, CATALOG, KIND_META, entriesByKind } from '@/components/docs';
import type { CatalogKind } from '@/components/docs';

const FEATURED_SLUGS = [
  'split-button',
  'menu-button',
  'field-group',
  'chat-message',
  'tree',
  'ai-provider-picker',
] as const;

const CATEGORIES: { kind: CatalogKind; icon: typeof Layers }[] = [
  { kind: 'components', icon: Layers },
  { kind: 'blocks', icon: Blocks },
  { kind: 'pages', icon: BookOpen },
];

/** Registry landing - hero over the animated backdrop, a featured grid, and the
 *  ecosystem sections. */
export default function HomePage() {
  const featured = FEATURED_SLUGS.map((slug) =>
    CATALOG.find((entry) => entry.slug === slug),
  ).filter((entry): entry is (typeof CATALOG)[number] => Boolean(entry));

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <AnimatedBackdrop />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-28 text-center">
          <Badge variant="secondary">v0.1 - shadcn-compatible registry</Badge>
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            @zeroxsolutions/ui
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            A monochrome, Base UI + cva component registry. Components, blocks,
            and pages - copy, paste, ship.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button render={<Link href="/components" />}>
              Browse components
              <ArrowRight />
            </Button>
            <Button variant="outline" render={<Link href="/blocks" />}>
              View blocks
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Featured</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((entry) => (
            <Card key={entry.slug} className="flex flex-col">
              <CardHeader>
                <CardTitle>{entry.title}</CardTitle>
                <CardDescription>{entry.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link
                  href={`/${entry.kind}/${entry.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Ecosystem</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map(({ kind, icon: Icon }) => {
            const meta = KIND_META[kind];
            const count = entriesByKind(kind).length;
            return (
              <Card key={kind} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-md border bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{meta.label}</CardTitle>
                  <CardDescription>{meta.blurb}</CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between">
                  <Badge variant="outline">
                    {count} item{count === 1 ? '' : 's'}
                  </Badge>
                  <Link
                    href={`/${kind}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Explore
                    <ArrowRight className="size-3.5" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
