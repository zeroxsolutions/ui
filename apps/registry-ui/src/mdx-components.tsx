import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { BlockPreview } from '@/components/data-display/block-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { ExamplePreview } from '@/components/data-display/example-preview';
import {
  SourceCodeBlock,
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockFile,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockLineNumbers,
  SourceCodeBlockTitle,
  SourceCodeBlockTrigger,
} from '@/components/data-display/source-code-block';
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
 * Every element and component a page in `content/docs` may use, passed to its compiled body. The prose
 * elements carry their own classes, so they are styled wherever the page puts them and a registry
 * component in the page keeps the look its recipe gives it.
 */
export const mdxComponents = {
  h2: ({ children, id, ...props }: ComponentProps<'h2'>) => (
    <h2 id={id} className="mt-10 scroll-m-24 text-xl font-semibold tracking-tight first:mt-0" {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h2>
  ),
  h3: ({ children, id, ...props }: ComponentProps<'h3'>) => (
    <h3 id={id} className="mt-8 scroll-m-24 text-lg font-semibold tracking-tight" {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h3>
  ),
  h4: ({ children, id, ...props }: ComponentProps<'h4'>) => (
    <h4 id={id} className="mt-6 scroll-m-24 font-semibold tracking-tight" {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h4>
  ),
  // A paragraph MDX puts inside a component, such as the Callout's description, is its only child
  // there and takes no margin, so the component's own spacing holds.
  p: (props: ComponentProps<'p'>) => <p className="not-first:mt-4" {...props} />,
  a: (props: ComponentProps<'a'>) => <a className="font-medium underline underline-offset-4" {...props} />,
  ul: (props: ComponentProps<'ul'>) => <ul className="mt-4 ml-6 list-disc" {...props} />,
  ol: (props: ComponentProps<'ol'>) => <ol className="mt-4 ml-6 list-decimal" {...props} />,
  li: (props: ComponentProps<'li'>) => <li className="mt-2" {...props} />,
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote className="text-muted-foreground mt-4 border-l-2 pl-4" {...props} />
  ),
  hr: (props: ComponentProps<'hr'>) => <hr className="my-8" {...props} />,
  // Only inline code reaches this: `pre` below reads a fence's code element without rendering it.
  code: (props: ComponentProps<'code'>) => (
    <code className="bg-muted rounded-md px-1 py-0.5 font-mono text-sm" {...props} />
  ),
  // A wide table scrolls sideways inside the column rather than widening the page.
  table: (props: ComponentProps<'table'>) => (
    <ScrollArea className="mt-6">
      <table className="w-full text-sm" {...props} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  th: (props: ComponentProps<'th'>) => (
    <th className="border-b py-2 pr-4 text-left font-medium whitespace-nowrap" {...props} />
  ),
  td: (props: ComponentProps<'td'>) => <td className="border-b py-2 pr-4 align-top" {...props} />,
  // A fence as the registry's `CodeBlock`, painted with the lines `rehypeDocsCode` tokenized as the
  // page compiled.
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
        <SourceCodeBlockHeader>
          <SourceCodeBlockTitle>
            <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
            {title ? <SourceCodeBlockFile>{title}</SourceCodeBlockFile> : null}
          </SourceCodeBlockTitle>
          <SourceCodeBlockActions>
            <SourceCodeBlockCopy />
          </SourceCodeBlockActions>
        </SourceCodeBlockHeader>
        <SourceCodeBlockContent>
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </SourceCodeBlock>
    );
  },
  // A numbered list of steps, each a heading, with the blocks between them; `steps` numbers them.
  Step: (props: ComponentProps<'h3'>) => <h3 className="mt-6 font-semibold tracking-tight" {...props} />,
  Steps: (props: ComponentProps<'div'>) => <div className="steps" {...props} />,
  // An item page's install section: the command, or the steps to copy it by hand.
  CodeTabs: (props: ComponentProps<typeof Tabs>) => <Tabs defaultValue="cli" className="mt-6" {...props} />,
  Tabs,
  TabsList: (props: ComponentProps<typeof TabsList>) => <TabsList variant="line" {...props} />,
  TabsTrigger,
  TabsContent,
  Callout: (props: ComponentProps<typeof Alert>) => <Alert className="mt-6 first:mt-0" {...props} />,
  AlertTitle,
  AlertDescription,
  ComponentPreview: ExamplePreview,
  BlockPreview,
  ComponentSource: ({ file, ...props }: ComponentProps<typeof ComponentSource>) => (
    <ComponentSource file={file} className="mt-6" {...props}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{props.language}</SourceCodeBlockLanguage>
          {file ? <SourceCodeBlockFile>{file.split('/').pop()}</SourceCodeBlockFile> : null}
        </SourceCodeBlockTitle>
        <SourceCodeBlockActions>
          <SourceCodeBlockCopy />
          <SourceCodeBlockTrigger />
        </SourceCodeBlockActions>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockLineNumbers />
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </ComponentSource>
  ),
  ComponentsList: () => <ComponentsList className="mt-8" />,
};
