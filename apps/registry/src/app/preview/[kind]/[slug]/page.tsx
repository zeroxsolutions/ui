import { notFound } from 'next/navigation';

import { findEntry, previewParams, type CatalogKind } from '@/components/docs';

export function generateStaticParams() {
  return previewParams().map(({ kind, slug }) => ({ kind, slug }));
}

/**
 * The standalone preview route - renders ONLY the looked-up example, full-bleed
 * with no docs chrome (it sits outside the `(main)` group). It is the iframe
 * `src` for `PreviewCode` and the `target="_blank"` fullscreen target.
 */
export default async function PreviewFramePage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;
  const entry = findEntry(kind as CatalogKind, slug);
  if (!entry) notFound();
  const { Example } = entry;
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-8">
      <Example />
    </div>
  );
}
