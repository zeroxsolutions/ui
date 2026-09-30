import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { ComponentPreview } from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/registry/bases/base-ui/ui/alert';
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
    <a href={`#${id}`} className="group/heading-anchor">
      {children}
      <span aria-hidden="true" className="text-muted-foreground ml-2 opacity-0 group-hover/heading-anchor:opacity-100">
        #
      </span>
    </a>
  );
}

/** Every element and component a page in `content/docs` may use, passed to its compiled body. */
export const mdxComponents = {
  h2: ({ id, className, children, ...props }: ComponentProps<'h2'>) => (
    <h2 id={id} className={cn('mt-10 scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h2>
  ),
  h3: ({ id, className, children, ...props }: ComponentProps<'h3'>) => (
    <h3 id={id} className={cn('mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h3>
  ),
  h4: ({ id, className, children, ...props }: ComponentProps<'h4'>) => (
    <h4 id={id} className={cn('mt-6 scroll-m-20 font-semibold tracking-tight', className)} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h4>
  ),
  p: ({ className, ...props }: ComponentProps<'p'>) => <p className={cn('leading-7', className)} {...props} />,
  code: ({ className, ...props }: ComponentProps<'code'>) =>
    typeof props.children === 'string' ? (
      <code className={cn('bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.9em]', className)} {...props} />
    ) : (
      <code className={className} {...props} />
    ),
  pre: ({ children, ...props }: ComponentProps<'pre'>) => (
    <DocsCodeBlock code={nodeText(children)}>
      <pre {...props}>{children}</pre>
    </DocsCodeBlock>
  ),
  Steps: ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('ml-4 border-l pl-8 [counter-reset:step]', className)} {...props} />
  ),
  Step: ({ className, ...props }: ComponentProps<'h3'>) => (
    <h3
      className={cn(
        'mt-8 font-semibold [counter-increment:step]',
        'before:bg-muted before:mr-4 before:-ml-12 before:inline-flex before:size-8 before:items-center before:justify-center before:rounded-full before:text-sm before:content-[counter(step)]',
        className,
      )}
      {...props}
    />
  ),
  CodeTabs: (props: ComponentProps<typeof Tabs>) => <Tabs defaultValue="cli" {...props} />,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Callout: Alert,
  AlertTitle,
  AlertDescription,
  ComponentPreview,
  ComponentSource,
};
