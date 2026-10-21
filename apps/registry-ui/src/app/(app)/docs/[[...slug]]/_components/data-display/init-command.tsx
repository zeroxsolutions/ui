'use client';

import { Suspense, type ReactNode } from 'react';

import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { DEFAULT_COMPONENT_BASE } from '@/constants/component-bases';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { useCurrentStyle } from '@/hooks/use-current-style';
import type { PlatformStyle } from '@/types/platform';

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
    <DocsCodeBlock
      code={`pnpm dlx shadcn@latest init --base ${DEFAULT_COMPONENT_BASE} --preset ${style}`}
      language="bash"
      className="mt-6"
    />
  );
}

export { InitCommand };
