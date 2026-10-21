import { notFound } from 'next/navigation';

import { PAGE_MARKDOWN_FILE } from '@/constants/page-markdown-file';
import { docsLlms, source } from '@/lib/source';

export const revalidate = false;
export const dynamicParams = false;

/**
 * One docs page as Markdown, at `/llms.mdx/docs/<slug>/content.md`; `next.config.mjs` rewrites
 * `/docs/<slug>.md` here. Every page is listed, so each is rendered at build: the worker has no content
 * files to render one from on a first request.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: [...page.slugs, PAGE_MARKDOWN_FILE] }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }): Promise<Response> {
  const { slug = [] } = await params;
  const page = slug.at(-1) === PAGE_MARKDOWN_FILE ? source.getPage(slug.slice(0, -1)) : undefined;
  if (!page) notFound();

  return new Response(await docsLlms.page(page), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
