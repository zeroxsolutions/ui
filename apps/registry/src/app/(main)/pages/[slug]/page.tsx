import { notFound } from 'next/navigation';

import { EntryDetail, entriesByKind, findEntry } from '@/components/docs';

export function generateStaticParams() {
  return entriesByKind('pages').map((entry) => ({ slug: entry.slug }));
}

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findEntry('pages', slug);
  if (!entry) notFound();
  return <EntryDetail entry={entry} />;
}
