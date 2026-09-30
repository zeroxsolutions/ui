import { parseCodeBlockAttributes } from 'fumadocs-core/mdx-plugins/codeblock-utils';

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  data?: { meta?: string };
  children?: HastNode[];
}

/**
 * Puts a code fence's `title="..."` on its `pre` as `title`, where the MDX `pre` component reads it.
 * fumadocs' own Shiki pass did this, and is off: the fence is highlighted by the registry's
 * highlighter as the page renders at build, so the only thing left to carry is the title.
 */
export function rehypeCodeTitle() {
  return (tree: HastNode): void => {
    const visit = (node: HastNode): void => {
      const code = node.tagName === 'pre' ? node.children?.[0] : undefined;
      const meta = code?.tagName === 'code' ? code.data?.meta : undefined;
      if (meta) {
        const { title } = parseCodeBlockAttributes(meta, ['title']).attributes;
        if (typeof title === 'string') node.properties = { ...node.properties, title };
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
