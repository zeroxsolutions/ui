import type { ComponentProps } from 'react';

import { mdxComponents as siteMdxComponents } from '@zeroxsolutions/ui/site/components/data-display/mdx-components';
import {
  SourceCodeCardActions,
  SourceCodeCardCode,
  SourceCodeCardContent,
  SourceCodeCardCopy,
  SourceCodeCardFile,
  SourceCodeCardHeader,
  SourceCodeCardLanguage,
  SourceCodeCardLineNumbers,
  SourceCodeCardTitle,
  SourceCodeCardTrigger,
} from '@zeroxsolutions/ui/site/components/data-display/source-code-card';
import { registryHomepage } from '@/lib/registry';
import { writtenDocsPage } from '@/lib/source';

import { BlockPreview } from '@zeroxsolutions/ui-docs-web/components/data-display/block-preview';
import { ComponentsList } from '@zeroxsolutions/ui-docs-web/components/data-display/components-list';
import { ComponentSource } from '@zeroxsolutions/ui/site/components/data-display/component-source';
import { ExamplePreview } from '@zeroxsolutions/ui/site/components/data-display/example-preview';
import { exampleDemos } from '@zeroxsolutions/ui/site/lib/example-demos';
import { viewRoute } from '@zeroxsolutions/ui-docs-web/routes';
import { InitCommand } from '@zeroxsolutions/ui-docs-web/components/data-display/init-command';
import { WebComponentsJson } from '@zeroxsolutions/ui-docs-web/components/data-display/web-components-json';

/** The demos this app serves a page of their own for; a preview of anything else gets no full page button. */
const demos = new Set(exampleDemos({ editor: false }));

/**
 * Every element and component a page in `content/docs` may use, passed to its compiled body: the site's
 * own, and the components that read this app's registry and docs.
 */
export const mdxComponents = {
  ...siteMdxComponents,
  ComponentPreview: (props: ComponentProps<typeof ExamplePreview>) => (
    <ExamplePreview viewHref={demos.has(props.name) ? viewRoute.build({ name: props.name }) : undefined} {...props} />
  ),
  BlockPreview,
  ComponentSource: ({ file, title, ...props }: ComponentProps<typeof ComponentSource>) => (
    <ComponentSource file={file} className="mt-6" {...props}>
      <SourceCodeCardHeader>
        <SourceCodeCardTitle>
          <SourceCodeCardLanguage>{props.language}</SourceCodeCardLanguage>
          {title || file ? <SourceCodeCardFile>{title ?? file?.split('/').pop()}</SourceCodeCardFile> : null}
        </SourceCodeCardTitle>
        <SourceCodeCardActions>
          <SourceCodeCardCopy />
          <SourceCodeCardTrigger />
        </SourceCodeCardActions>
      </SourceCodeCardHeader>
      <SourceCodeCardContent>
        <SourceCodeCardLineNumbers />
        <SourceCodeCardCode />
      </SourceCodeCardContent>
    </ComponentSource>
  ),
  ComponentsList: () => <ComponentsList className="mt-8" writtenDocsPage={writtenDocsPage} />,
  InitCommand,
  WebComponentsJson: () => <WebComponentsJson origin={registryHomepage} />,
};
