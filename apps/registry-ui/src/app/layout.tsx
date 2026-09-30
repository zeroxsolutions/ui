import type { Metadata } from 'next';

import { registryHomepage } from '@/lib/registry';
import { AppProviders } from '@/providers/app-providers';

import './global.css';

export const metadata: Metadata = {
  // The share images' URLs resolve against it; unset, the build warns and falls back to localhost.
  metadataBase: new URL(registryHomepage),
  title: 'ZeroXSolutions UI',
  description: 'Base UI components and blocks, distributed as a shadcn registry.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme provider sets the theme class on <html> before hydration, so the server's markup differs.
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
