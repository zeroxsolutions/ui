import type { ComponentProps } from 'react';

import { DEFAULT_NATIVE_ENGINE } from '@zeroxsolutions/ui/site/constants/native-engines';
import { mdxComponents } from '@zeroxsolutions/ui/site/components/data-display/mdx-components';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import { ComponentsJson } from '@zeroxsolutions/native-ui-docs-web/components/data-display/components-json';
import { EngineTab, EngineTabs } from '@zeroxsolutions/native-ui-docs-web/components/data-display/engine-tabs';
import { InstallCommand } from '@zeroxsolutions/native-ui-docs-web/components/data-display/install-command';
import { NativeDocsLink } from '@zeroxsolutions/native-ui-docs-web/components/data-display/native-docs-link';
import { NativePreview } from '@zeroxsolutions/native-ui-docs-web/components/data-display/native-preview';
import { withNativeEngine } from '@zeroxsolutions/native-ui-docs-web/lib/native-location';

import { registryHomepage } from '@/lib/registry';

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
