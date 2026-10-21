import { notFound } from 'next/navigation';

import { shareImage } from '@/lib/share-image';
import { docsPageImage, source } from '@/lib/source';
import { docsShareImageRoute } from '@/routes/app-routes';

export const revalidate = false;
export const dynamicParams = false;

/**
 * Every docs page's share image, listed so each is drawn once at build. A page cannot carry an
 * `opengraph-image` file here: Next refuses one inside the optional catch-all `[[...slug]]`.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: docsPageImage(page).segments }));
}

/** A docs page's share image. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<Response> {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page || docsPageImage(page).url !== docsShareImageRoute.build({ slug: slug.join('/') })) notFound();

  return shareImage({ title: page.data.title, description: page.data.description });
}
