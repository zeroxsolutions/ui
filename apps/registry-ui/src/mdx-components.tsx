import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { CodeBlockCommand } from '@/components/data-display/code-block-command';
import { CodeTabs } from '@/components/data-display/code-tabs';
import { ComponentPreview } from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { SourceCodeBlock } from '@/components/data-display/source-code-block';
import { ComponentsList } from '@/components/navigation/components-list';
import { packageManagerCommands } from '@/lib/package-manager-commands';
import { highlightToLines } from '@/registry/bases/base-ui/lib/shiki';
import { cn } from '@/registry/bases/base-ui/lib/utils';
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

/** A heading's text as a link to itself, upstream's; the id comes from the MDX compiler, which slugs every heading. */
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
 * Every element and component a page in `content/docs` may use, passed to its compiled body, upstream's
 * `mdx-components.tsx` on this site's primitives. Prose takes its styles from `.typeset` around the
 * body, so the plain elements carry no classes.
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
  // Upstream's wrapper is a plain `overflow-x: auto` box; here it is a `ScrollArea`, still `typeset-scroll`
  // for typeset's margins and its max-content table width, its viewport carrying upstream's edge fade.
  table: (props: ComponentProps<'table'>) => (
    <ScrollArea className="typeset-scroll **:data-[slot=scroll-area-viewport]:scroll-fade-x [&_table]:w-full">
      <table {...props} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  // A fence, upstream's `pre` + `code` pair, as the registry's `CodeBlock`: the fence's text tokenized
  // here, as the page renders at build, by the registry's highlighter, and an npm command as the
  // package-manager block. Inline code stays a plain `code`, which typeset styles.
  pre: async ({ children, title }: ComponentProps<'pre'>) => {
    const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children.props : {};
    const language = /language-(\S+)/.exec(code.className ?? '')?.[1];
    const raw = nodeText(code.children).replace(/\n$/, '');
    const commands = packageManagerCommands(raw);
    if (commands) return <CodeBlockCommand commands={commands} className="mt-6" />;

    return (
      <SourceCodeBlock
        code={raw}
        language={language}
        lines={language ? await highlightToLines(raw, language) : null}
        className="mt-6"
      >
        {title}
      </SourceCodeBlock>
    );
  },
  Step: (props: ComponentProps<'h3'>) => <h3 {...props} />,
  Steps: ({ className, ...props }: ComponentProps<'div'>) => (
    <div
      className={cn('steps [&>h3]:step mb-12 [counter-reset:step] md:ml-4 md:border-l md:pl-8', className)}
      {...props}
    />
  ),
  Tabs: ({ className, ...props }: ComponentProps<typeof Tabs>) => (
    <Tabs className={cn('relative mt-6 w-full', className)} {...props} />
  ),
  TabsList: ({ className, ...props }: ComponentProps<typeof TabsList>) => (
    <TabsList className={cn('justify-start gap-4 rounded-none bg-transparent px-0', className)} {...props} />
  ),
  // Upstream's classes, with Base UI's `data-active` for Radix's `data-[state=active]`.
  TabsTrigger: ({ className, ...props }: ComponentProps<typeof TabsTrigger>) => (
    <TabsTrigger
      className={cn(
        'not-typeset text-muted-foreground hover:text-primary data-active:border-primary data-active:text-foreground dark:data-active:border-primary rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 text-base data-active:bg-transparent data-active:shadow-none! dark:data-active:bg-transparent',
        className,
      )}
      {...props}
    />
  ),
  TabsContent: ({ className, ...props }: ComponentProps<typeof TabsContent>) => (
    <TabsContent
      className={cn(
        'relative [&_h3.font-heading]:text-base [&_h3.font-heading]:font-medium *:[figure]:first:mt-0 [&>.steps]:mt-6',
        className,
      )}
      {...props}
    />
  ),
  CodeTabs,
  Callout: Alert,
  AlertTitle,
  AlertDescription,
  ComponentPreview,
  ComponentSource,
  ComponentsList,
};
