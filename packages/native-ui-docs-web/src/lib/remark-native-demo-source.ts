interface MdastNode {
  type: string;
  name?: string | null;
  attributes?: { type: string; name?: string; value?: unknown }[];
  children?: MdastNode[];
}

function previewName(node: MdastNode): string {
  const value = node.attributes?.find((attribute) => attribute.name === 'name')?.value;
  return typeof value === 'string' ? value : '';
}

interface RemarkNativeDemoSourceOptions {
  /**
   * Reads the source of the demo `name`, and throws for a name that is not a demo's: `nativeDemoSourceOf`
   * in `@zeroxsolutions/ui/site/lib/rehype-docs-code`. Handed in because fumadocs-mdx leaves this module's
   * own package imports to Node, which cannot load that module's `.ts`.
   */
  demoSource(name: string): Promise<string>;
}

/**
 * Gives each `NativePreview` its demo's source as `code` while the page is still Markdown, so the Markdown
 * fumadocs-mdx keeps of a native page can print the demo; `rehypeDocsCode` runs after that Markdown is
 * kept. Throws for a name that is not a demo's, so a page naming one fails its build.
 */
export function remarkNativeDemoSource({ demoSource }: RemarkNativeDemoSourceOptions) {
  return async (tree: MdastNode): Promise<void> => {
    const previews: MdastNode[] = [];
    const visit = (node: MdastNode): void => {
      if (node.type === 'mdxJsxFlowElement' && node.name === 'NativePreview') previews.push(node);
      node.children?.forEach(visit);
    };
    visit(tree);
    await Promise.all(
      previews.map(async (node) => {
        const code = (await demoSource(previewName(node))).trimEnd();
        node.attributes = [...(node.attributes ?? []), { type: 'mdxJsxAttribute', name: 'code', value: code }];
      }),
    );
  };
}
