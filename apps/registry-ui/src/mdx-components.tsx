import type { ComponentProps, ReactNode } from 'react';

import { CodeBlockCommand } from '@/components/data-display/code-block-command';
import { CodeCollapsibleWrapper } from '@/components/data-display/code-collapsible-wrapper';
import { CodeTabs } from '@/components/data-display/code-tabs';
import { ComponentPreview } from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { CopyButton } from '@/components/data-display/copy-button';
import { DocsCodeBlockScrollArea, DocsCodeBlockTitle } from '@/components/data-display/docs-code-block';
import { ComponentsList } from '@/components/navigation/components-list';
import { packageManagerCommands } from '@/lib/highlight-code';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/registry/bases/base-ui/ui/alert';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

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
  // for typeset's margins and its max-content table width.
  table: (props: ComponentProps<'table'>) => (
    <ScrollArea className="typeset-scroll [&_table]:w-full">
      <table {...props} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  // Upstream's `pre`, less its overflow: a fence's code scrolls in the block's `ScrollArea`, and its copy
  // button sits beside that, outside the scroller. A package-manager block is its own scroller and copy.
  pre: ({ className, children, __raw__, ...props }: ComponentProps<'pre'> & { __raw__?: string }) => {
    const pre = (
      <pre
        data-not-typeset
        className={cn(
          'min-w-0 px-4 py-3.5 outline-none has-data-highlighted-line:px-0 has-data-line-numbers:px-0 has-data-[slot=tabs]:p-0',
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    );
    if (!__raw__ || packageManagerCommands(__raw__)) return pre;

    return (
      <>
        <CopyButton value={__raw__} />
        <DocsCodeBlockScrollArea>{pre}</DocsCodeBlockScrollArea>
      </>
    );
  },
  figcaption: ({
    children,
    'data-language': language,
    ...props
  }: ComponentProps<'figcaption'> & { 'data-language'?: string }) =>
    typeof language === 'string' ? (
      <DocsCodeBlockTitle language={language} {...props}>
        {children}
      </DocsCodeBlockTitle>
    ) : (
      <figcaption {...props}>{children}</figcaption>
    ),
  code: ({
    __npm__,
    __yarn__,
    __pnpm__,
    __bun__,
    ...props
  }: ComponentProps<'code'> & {
    __npm__?: string;
    __yarn__?: string;
    __pnpm__?: string;
    __bun__?: string;
  }) => {
    // An npm command, under a tab per package manager; anything else, inline or in a fence, as it is.
    if (__npm__ && __yarn__ && __pnpm__ && __bun__) {
      return <CodeBlockCommand __npm__={__npm__} __yarn__={__yarn__} __pnpm__={__pnpm__} __bun__={__bun__} />;
    }
    return <code {...props} />;
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
  CodeCollapsibleWrapper,
  ComponentsList,
};
