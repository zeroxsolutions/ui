/** A page as a loader gives it, as far as its Markdown document reads it. */
export interface MarkdownPage {
  url: string;
  data: { title?: string; getText: (type: 'processed') => Promise<string> };
}

/** A page's Markdown document: its title and URL over `body`. */
export function pageMarkdownDocument(
  page: Pick<MarkdownPage, 'url'> & { data: { title?: string } },
  body: string,
): string {
  return `# ${page.data.title} (${page.url})\n\n${body}`;
}

/** One page as Markdown: its title and URL over the Markdown fumadocs-mdx keeps of its body. */
export async function pageMarkdown(page: MarkdownPage): Promise<string> {
  return pageMarkdownDocument(page, await page.data.getText('processed'));
}

/** The first of `pages` whose body previews the demo `name`, as `<ComponentPreview name>`; `undefined` where none does. */
export async function pagePreviewing<Page extends MarkdownPage>(
  pages: readonly Page[],
  name: string,
): Promise<Page | undefined> {
  const asked = `name="${name}"`;
  for (const page of pages) {
    const body = await page.data.getText('processed');
    if (body.includes('<ComponentPreview') && body.includes(asked)) return page;
  }
  return undefined;
}
