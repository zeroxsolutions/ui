import { notFound } from 'next/navigation';

import { PAGE_MARKDOWN_FILE } from '@/constants/page-markdown-file';
import { NATIVE_ENGINES } from '@/constants/native-engines';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { nativePageMarkdown } from '@/lib/native-page-markdown';
import { nativeComponentsSources } from '@/lib/native-source';

export const revalidate = false;
export const dynamicParams = false;

/**
 * One native component page as Markdown under one engine, at
 * `/llms.mdx/native/components/<engine>/<name>/content.md`; `next.config.mjs` rewrites
 * `/native/components/<engine>/<name>.md` here. It is what Copy page copies on that engine's page. A static
 * file answers no query, so its snippets are in the default style.
 */
export function generateStaticParams(): { engine: string; slug: string[] }[] {
  return NATIVE_ENGINES.flatMap((engine) =>
    nativeComponentsSources[engine].getPages().map((page) => ({ engine, slug: [...page.slugs, PAGE_MARKDOWN_FILE] })),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ engine: string; slug?: string[] }> },
): Promise<Response> {
  const { engine: segment, slug = [] } = await params;
  const engine = NATIVE_ENGINES.find((known) => known === segment);
  const page =
    engine && slug.at(-1) === PAGE_MARKDOWN_FILE
      ? nativeComponentsSources[engine].getPage(slug.slice(0, -1))
      : undefined;
  if (!page) notFound();

  return new Response(await nativePageMarkdown(page, { engine, style: DEFAULT_PLATFORM_STYLE.native }), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
