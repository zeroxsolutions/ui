import { notFound } from 'next/navigation';

import { PAGE_MARKDOWN_FILE } from '@/constants/page-markdown-file';
import { nativeDocsLlms, nativeDocsSource } from '@/lib/native-source';

export const revalidate = false;
export const dynamicParams = false;

/** One native docs page as Markdown, at `/llms.mdx/native/docs/<slug>/content.md`; `next.config.mjs` rewrites `/native/docs/<slug>.md` here. */
export function generateStaticParams(): { slug: string[] }[] {
  return nativeDocsSource.getPages().map((page) => ({ slug: [...page.slugs, PAGE_MARKDOWN_FILE] }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }): Promise<Response> {
  const { slug = [] } = await params;
  const page = slug.at(-1) === PAGE_MARKDOWN_FILE ? nativeDocsSource.getPage(slug.slice(0, -1)) : undefined;
  if (!page) notFound();

  return new Response(await nativeDocsLlms.page(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
