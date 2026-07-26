import { notFound } from 'next/navigation';

import { EntryDetail, entriesByKind, findEntry } from '@/components/docs';

export function generateStaticParams() {
  return entriesByKind('blocks').map((entry) => ({ slug: entry.slug }));
}

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findEntry('blocks', slug);
  if (!entry) notFound();
  return <EntryDetail entry={entry} />;
}
