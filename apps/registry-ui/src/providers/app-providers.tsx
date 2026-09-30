import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

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
