import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { editorDocsShareImageRoute } from '@zeroxsolutions/editor-docs-web/routes';

import { shareImageElement, shareImageSize } from '@zeroxsolutions/ui/site/lib/share-image';
import { docsPageImage, editorPage, source } from '@/lib/source';

export const revalidate = false;
export const dynamicParams = false;

/**
 * Every editor docs page's share image, listed so each is drawn once at build. A page cannot carry an
 * `opengraph-image` file here: Next refuses one inside the optional catch-all `[[...slug]]`.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: docsPageImage(page).segments }));
}

/** An editor docs page's share image. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<Response> {
  const { slug } = await params;
  const page = editorPage(slug.slice(0, -1));
  if (!page || docsPageImage(page).url !== editorDocsShareImageRoute.build({ slug: slug.join('/') })) notFound();

  return new ImageResponse(
    shareImageElement({ title: page.data.title, description: page.data.description }),
    shareImageSize,
  );
}
