import { notFound } from 'next/navigation';

import { EntryDetail, entriesByKind, findEntry } from '@/components/docs';

export function generateStaticParams() {
  return entriesByKind('components').map((entry) => ({ slug: entry.slug }));
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findEntry('components', slug);
  if (!entry) notFound();
  return <EntryDetail entry={entry} />;
}
