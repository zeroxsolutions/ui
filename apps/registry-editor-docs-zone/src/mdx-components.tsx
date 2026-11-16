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

import { ComponentSource } from '@zeroxsolutions/ui/site/components/data-display/component-source';
import { ExamplePreview } from '@zeroxsolutions/ui/site/components/data-display/example-preview';
import { editorExampleViewRoute } from '@zeroxsolutions/editor-docs-web/routes';

/**
 * Every element and component a page in `content/docs/editor` may use, passed to its compiled body: the
 * site's own, and the demo previews and source cards that read the examples index.
 */
export const mdxComponents = {
  ...siteMdxComponents,
  ComponentPreview: (props: ComponentProps<typeof ExamplePreview>) => (
    <ExamplePreview viewHref={editorExampleViewRoute.build({ name: props.name })} {...props} />
  ),
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
};
