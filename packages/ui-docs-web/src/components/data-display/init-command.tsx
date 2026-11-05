'use client';

import { Suspense, type ReactNode } from 'react';

import { DocsCodeCard } from '@zeroxsolutions/ui/site/components/data-display/docs-code-card';
import { DEFAULT_COMPONENT_BASE } from '@zeroxsolutions/ui/site/constants/component-bases';
import { DEFAULT_PLATFORM_STYLE } from '@zeroxsolutions/ui/site/constants/platform-styles';
import { useCurrentStyle } from '@zeroxsolutions/ui/site/hooks/use-current-style';
import type { PlatformStyle } from '@zeroxsolutions/ui/site/types/platform';

/** The command that writes a web app's `components.json` on Base UI, in the style the page shows. */
function InitCommand(): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page shows the default style.
    <Suspense fallback={<InitCommandBlock style={DEFAULT_PLATFORM_STYLE.web} />}>
      <InitCommandFromUrl />
    </Suspense>
  );
}

function InitCommandFromUrl(): ReactNode {
  return <InitCommandBlock style={useCurrentStyle('web')} />;
}

function InitCommandBlock({ style }: { style: PlatformStyle<'web'> }): ReactNode {
  return (
    <DocsCodeCard
      code={`pnpm dlx shadcn@latest init --base ${DEFAULT_COMPONENT_BASE} --preset ${style}`}
      language="bash"
      className="mt-6"
    />
  );
}

export { InitCommand };
