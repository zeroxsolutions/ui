import type { Metadata } from 'next';

import { registryHomepage } from '@/lib/registry';
import { AppProviders } from '@/providers/app-providers';

import './global.css';
// After the global sheet, as upstream orders them: typeset's rules and the code block's share a layer
// and a specificity, so the later sheet's margins win.
import './typeset.css';

export const metadata: Metadata = {
  // The share images' URLs resolve against it; unset, the build warns and falls back to localhost.
  metadataBase: new URL(registryHomepage),
  title: { default: 'ZeroXSolutions UI', template: '%s - ZeroXSolutions UI' },
  description: 'Base UI components and blocks, distributed as a shadcn registry.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme provider sets the theme class on <html> before hydration, so the server's markup differs.
    <html
      lang="en"
      suppressHydrationWarning
      className="[--header-height:calc(var(--spacing)*14)] lg:[--header-height:calc(var(--spacing)*16)]"
    >
      <body className="group/body overscroll-none antialiased [--footer-height:calc(var(--spacing)*14)] xl:[--footer-height:calc(var(--spacing)*24)]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
