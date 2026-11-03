import type { ComponentProps } from 'react';

import { DEFAULT_NATIVE_ENGINE } from '@zeroxsolutions/ui/site/constants/native-engines';
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
import { withNativeEngine } from '@/lib/platform-nav';
import { registryHomepage } from '@/lib/registry';
import { writtenDocsPage } from '@/lib/source';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import { BlockPreview } from '@zeroxsolutions/ui-docs-web/components/data-display/block-preview';
import { ComponentsList } from '@zeroxsolutions/ui-docs-web/components/data-display/components-list';
import { ComponentSource } from '@zeroxsolutions/ui-docs-web/components/data-display/component-source';
import { ExamplePreview } from '@zeroxsolutions/ui-docs-web/components/data-display/example-preview';
import { InitCommand } from '@zeroxsolutions/ui-docs-web/components/data-display/init-command';
import { WebComponentsJson } from '@zeroxsolutions/ui-docs-web/components/data-display/web-components-json';

// This MDX override map is the docs routes' composition root, so importing the native docs' components
// from their route's private folder (never a route segment, for the `_` prefix) is expected here, even
// though this file sits at `src/` because Next/fumadocs requires it there.
import { ComponentsJson } from '@/app/(app)/native/_components/data-display/components-json';
import { EngineTab, EngineTabs } from '@/app/(app)/native/_components/data-display/engine-tabs';
import { InstallCommand } from '@/app/(app)/native/_components/data-display/install-command';
import { NativeDocsLink } from '@/app/(app)/native/_components/data-display/native-docs-link';
import { NativePreview } from '@/app/(app)/native/_components/data-display/native-preview';

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

/**
 * Every element and component a page in `content/native` may use. `engine` is the one a component page
 * is read under, and is absent on a native docs page: it moves the page's links to other component
 * pages onto it, and shows only its part of each `EngineTabs`.
 */
export function nativeMdxComponents(engine?: NativeEngine) {
  return {
    ...mdxComponents,
    a: ({ href, ...props }: ComponentProps<'a'>) =>
      engine ? (
        mdxComponents.a({
          href: href ? withNativeEngine(href, engine) : href,
          ...props,
        })
      ) : (
        <NativeDocsLink href={href} {...props} />
      ),
    EngineTabs: (props: Omit<ComponentProps<typeof EngineTabs>, 'engine'>) => <EngineTabs engine={engine} {...props} />,
    EngineTab,
    InstallCommand: (props: Omit<ComponentProps<typeof InstallCommand>, 'engine' | 'origin'>) => (
      <InstallCommand engine={engine} origin={registryHomepage} {...props} />
    ),
    ComponentsJson: (props: Omit<ComponentProps<typeof ComponentsJson>, 'origin'>) => (
      <ComponentsJson origin={registryHomepage} {...props} />
    ),
    NativePreview: (props: Omit<ComponentProps<typeof NativePreview>, 'engine'>) => (
      <NativePreview engine={engine ?? DEFAULT_NATIVE_ENGINE} {...props} />
    ),
  };
}
