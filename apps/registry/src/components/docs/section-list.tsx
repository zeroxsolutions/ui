import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@zeroxsolutions/ui/components/ui/card';

import { entriesByKind, KIND_META, type CatalogKind } from './doc-catalog';

/**
 * A section list page (`/components`, `/blocks`, `/pages`): the kind label +
 * blurb, then a card grid linking each entry to its detail route
 * `/<kind>/<slug>`.
 */
export function SectionList({ kind }: { kind: CatalogKind }) {
  const entries = entriesByKind(kind);
  const meta = KIND_META[kind];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{meta.label}</h1>
        <p className="mt-2 text-muted-foreground">{meta.blurb}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Card key={entry.slug} className="flex flex-col">
            <CardHeader>
              <CardTitle>{entry.title}</CardTitle>
              <CardDescription>{entry.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link
                href={`/${kind}/${entry.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View <ArrowRight className="size-3.5" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
