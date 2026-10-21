import { notFound } from 'next/navigation';

import { canonicalNativeComponentsSource, nativeDocsSource, nativePageImage } from '@/lib/native-source';
import { shareImage } from '@/lib/share-image';
import { nativeShareImageRoute } from '@/routes/app-routes';

export const revalidate = false;
export const dynamicParams = false;

/** Every native page's share image, listed so each is drawn once at build; a component's is shared by its engines. */
export function generateStaticParams(): { slug: string[] }[] {
  return [
    ...nativeDocsSource.getPages().map((page) => ({ slug: nativePageImage('docs', page.slugs).segments })),
    ...canonicalNativeComponentsSource
      .getPages()
      .map((page) => ({ slug: nativePageImage('components', page.slugs).segments })),
  ];
}

/** A native page's share image. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<Response> {
  const { slug } = await params;
  const [section, ...rest] = slug;
  const slugs = rest.slice(0, -1);
  const page =
    section === 'docs'
      ? nativeDocsSource.getPage(slugs)
      : section === 'components'
        ? canonicalNativeComponentsSource.getPage(slugs)
        : undefined;
  if (
    !page ||
    (section !== 'docs' && section !== 'components') ||
    nativePageImage(section, page.slugs).url !== nativeShareImageRoute.build({ slug: slug.join('/') })
  ) {
    notFound();
  }

  return shareImage({ title: page.data.title, description: page.data.description });
}
