'use client';

import { setFluentEmojiBase } from '@zeroxsolutions/fluent-emoji';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

// Point the whole fluent-emoji resolver at the org's bucket, which serves every style from one root
// (see the package README's "Serving every style from one base"), so `anim` resolves too, not just the
// four styles the npm tarball ships. Module scope, in a client module every page renders inside
// (`RootLayout` wraps `children` in this), so it runs once for the SSR pass that renders client
// components and once in the browser - the two places that read fluentEmojiUrl's module-scoped base.
// Next keeps a Server Component's module graph apart from this one, so this would not reach the emoji
// components (also client components) if it sat in `layout.tsx` or in a file with no `'use client'`.
setFluentEmojiBase('https://fluent-emoji.zeroxsolutions.com');

/**
 * The providers every page renders inside. The theme is a class on `<html>`, which the stylesheet's
 * `dark` variant reads; left unset, the provider follows the system's colour scheme.
 */
function AppProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

export { AppProviders };
