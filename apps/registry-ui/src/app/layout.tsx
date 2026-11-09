import type { Metadata } from 'next';

import { PageStyle } from '@zeroxsolutions/ui/site/components/general/page-style';

import { registryHomepage } from '@/lib/registry';
import { AppProviders } from '@/providers/app-providers';

import './global.css';

export const metadata: Metadata = {
  // The share images' URLs resolve against it; unset, the build warns and falls back to localhost.
  metadataBase: new URL(registryHomepage),
  title: { default: 'ZUI', template: '%s - ZUI' },
  description: 'Base UI components and blocks, distributed as a shadcn registry.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme provider and the page's style set their classes on <html> before hydration, so the server's
    // markup differs; `style-nova` draws the page where no script runs.
    <html
      lang="en"
      suppressHydrationWarning
      className="style-nova [--header-height:calc(var(--spacing)*14)] lg:[--header-height:calc(var(--spacing)*16)]"
    >
      <body className="group/body overscroll-none antialiased [--footer-height:calc(var(--spacing)*14)] xl:[--footer-height:calc(var(--spacing)*24)]">
        <AppProviders>
          <PageStyle platform="web" />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
