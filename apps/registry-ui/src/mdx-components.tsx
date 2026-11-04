import type { ComponentProps } from 'react';

import { mdxComponents as siteMdxComponents } from '@zeroxsolutions/ui/site/components/data-display/mdx-components';
import {
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
} from '@zeroxsolutions/ui/site/components/data-display/source-code-block';
import { registryHomepage } from '@/lib/registry';
import { writtenDocsPage } from '@/lib/source';

import { BlockPreview } from '@zeroxsolutions/ui-docs-web/components/data-display/block-preview';
import { ComponentsList } from '@zeroxsolutions/ui-docs-web/components/data-display/components-list';
import { ComponentSource } from '@zeroxsolutions/ui-docs-web/components/data-display/component-source';
import { ExamplePreview } from '@zeroxsolutions/ui-docs-web/components/data-display/example-preview';
import { InitCommand } from '@zeroxsolutions/ui-docs-web/components/data-display/init-command';
import { WebComponentsJson } from '@zeroxsolutions/ui-docs-web/components/data-display/web-components-json';

/**
 * Every element and component a page in `content/docs` may use, passed to its compiled body: the site's
 * own, and the components that read this app's registry and docs.
 */
export const mdxComponents = {
  ...siteMdxComponents,
  ComponentPreview: ExamplePreview,
  BlockPreview,
  ComponentSource: ({ file, title, ...props }: ComponentProps<typeof ComponentSource>) => (
    <ComponentSource file={file} className="mt-6" {...props}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{props.language}</SourceCodeBlockLanguage>
          {title || file ? <SourceCodeBlockFile>{title ?? file?.split('/').pop()}</SourceCodeBlockFile> : null}
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
  ComponentsList: () => <ComponentsList className="mt-8" writtenDocsPage={writtenDocsPage} />,
  InitCommand,
  WebComponentsJson: () => <WebComponentsJson origin={registryHomepage} />,
};
