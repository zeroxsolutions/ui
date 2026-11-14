'use client';

import { setFluentEmojiBase } from '@zeroxsolutions/fluent-emoji';
import { RegistryExamplesProvider } from '@zeroxsolutions/ui/site/components/data-display/registry-example';
import { HostProvider } from '@zeroxsolutions/ui/host';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { Components } from '@/registry/bases/base-ui/examples/__components__';
import { EditorComponentsClientOnly } from '@/registry/bases/base-ui/examples/__editor-components-client-only__';

import { useNextHost } from './next-host';

// Point the whole fluent-emoji resolver at the org's bucket, which serves every style from one root
// (see the package README's "Serving every style from one base"), so `anim` resolves too, not just the
// four styles the npm tarball ships. Module scope, in a client module every page renders inside
// (`RootLayout` wraps `children` in this), so it runs once for the SSR pass that renders client
// components and once in the browser - the two places that read fluentEmojiUrl's module-scoped base.
// Next keeps a Server Component's module graph apart from this one, so this would not reach the emoji
// components (also client components) if it sat in `layout.tsx` or in a file with no `'use client'`.
setFluentEmojiBase('https://fluent-emoji.zeroxsolutions.com');

const examples = { ...Components, ...EditorComponentsClientOnly };

/**
 * The providers every page renders inside. The host hands the site components Next's link and router. The theme is a class on `<html>`, which the stylesheet's
 * `dark` variant reads; left unset, the provider follows the system's colour scheme. The demos are the
 * ones the preview renders: every demo, the editors' through `next/dynamic` so the server bundle leaves them out.
 */
function AppProviders({ children }: { children: ReactNode }): ReactNode {
  const host = useNextHost();
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      <HostProvider host={host}>
        <RegistryExamplesProvider components={examples}>{children}</RegistryExamplesProvider>
      </HostProvider>
    </ThemeProvider>
  );
}

export { AppProviders };
