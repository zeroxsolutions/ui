import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { ComponentPreview } from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import { ComponentsList } from '@/components/navigation/components-list';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';
import { Alert, AlertDescription, AlertTitle } from '@/registry/bases/base-ui/ui/alert';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

/** The text a node renders, as a reader would copy it. */
function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return '';
}

/** A heading's text as a link to itself; the id comes from the MDX compiler, which slugs every heading. */
function HeadingAnchor({ id, children }: { id?: string; children: ReactNode }): ReactNode {
  if (!id) return children;

  return (
    <a className="group no-underline" href={`#${id}`}>
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <span aria-hidden="true" className="text-muted-foreground ml-2 opacity-0 group-hover:opacity-100">
        #
      </span>
    </a>
  );
}

/**
 * Every element and component a page in `content/docs` may use, passed to its compiled body. Prose
 * takes its styles from `.typeset` around the body, so the plain elements carry no classes.
 */
export const mdxComponents = {
  h2: ({ children, id, ...props }: ComponentProps<'h2'>) => (
    <h2 id={id} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h2>
  ),
  h3: ({ children, id, ...props }: ComponentProps<'h3'>) => (
    <h3 id={id} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h3>
  ),
  h4: ({ children, id, ...props }: ComponentProps<'h4'>) => (
    <h4 id={id} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h4>
  ),
  // A wide table scrolls sideways inside the column rather than widening the page; `typeset-scroll`
  // gives it typeset's margins and its max-content table width.
  table: (props: ComponentProps<'table'>) => (
    <ScrollArea className="typeset-scroll [&_table]:w-full">
      <table {...props} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  // A fence as the registry's `CodeBlock`, painted with the lines `rehypeDocsCode` tokenized as the
  // page compiled. Inline code stays a plain `code`, which typeset styles.
  pre: ({ children, title, lines }: ComponentProps<'pre'> & { lines?: string }) => {
    const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children.props : {};
    const language = /language-(\S+)/.exec(code.className ?? '')?.[1];

    return (
      <SourceCodeBlock
        code={nodeText(code.children).replace(/\n$/, '')}
        language={language}
        lines={lines ? (JSON.parse(lines) as HighlightLine[] | null) : null}
        className="mt-6"
      >
        {title}
      </SourceCodeBlock>
    );
  },
  // A numbered list of steps, each a heading, with the blocks between them; `steps` numbers them.
  Step: (props: ComponentProps<'h3'>) => <h3 {...props} />,
  Steps: (props: ComponentProps<'div'>) => <div className="steps" {...props} />,
  // An item page's install section: the command, or the steps to copy it by hand.
  CodeTabs: (props: ComponentProps<typeof Tabs>) => <Tabs defaultValue="cli" {...props} />,
  Tabs,
  TabsList: (props: ComponentProps<typeof TabsList>) => <TabsList variant="line" {...props} />,
  TabsTrigger,
  TabsContent,
  Callout: Alert,
  AlertTitle,
  AlertDescription,
  ComponentPreview,
  ComponentSource,
  ComponentsList,
};
