'use client';

import { Suspense, type ReactNode } from 'react';

import { DocsCodeBlock } from '@zeroxsolutions/ui/site/components/data-display/docs-code-block';
import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import { DEFAULT_PLATFORM_STYLE } from '@zeroxsolutions/ui/site/constants/platform-styles';
import { useCurrentStyle } from '@zeroxsolutions/ui/site/hooks/use-current-style';
import { registryStyle } from '@zeroxsolutions/ui/site/lib/style-choice';
import type { PlatformStyle } from '@zeroxsolutions/ui/site/types/platform';

interface WebComponentsJsonProps {
  /** The origin the registry is served from, which the MDX components bind. */
  origin: string;
}

/** The `style` and `registries` a web app's `components.json` holds for this registry, its style the one the page shows. */
function WebComponentsJson(props: WebComponentsJsonProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page shows the default style.
    <Suspense fallback={<WebComponentsJsonBlock {...props} style={DEFAULT_PLATFORM_STYLE.web} />}>
      <WebComponentsJsonFromUrl {...props} />
    </Suspense>
  );
}

function WebComponentsJsonFromUrl(props: WebComponentsJsonProps): ReactNode {
  return <WebComponentsJsonBlock {...props} style={useCurrentStyle('web')} />;
}

function WebComponentsJsonBlock({
  origin,
  style,
}: WebComponentsJsonProps & { style: PlatformStyle<'web'> }): ReactNode {
  const json = {
    style: registryStyle({ platform: 'web', base: DEFAULT_COMPONENT_BASE, style }),
    registries: { '@zui': `${origin}/r/styles/{style}/{name}.json` },
  };

  return (
    <DocsCodeBlock code={JSON.stringify(json, null, 2)} language="json" title="components.json" className="mt-6" />
  );
}

export { WebComponentsJson };
