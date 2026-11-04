/** A page's Markdown document: its title and URL over `body`. */
export function pageMarkdownDocument(page: { url: string; data: { title?: string } }, body: string): string {
  return `# ${page.data.title} (${page.url})\n\n${body}`;
}
