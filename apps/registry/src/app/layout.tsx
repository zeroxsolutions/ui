import './global.css';

export const metadata = {
  title: '@zeroxsolutions/ui registry',
  description:
    'Isolated component previews and the shadcn-compatible registry for @zeroxsolutions/ui.',
};

/**
 * Root layout - minimal on purpose: `<html><body>{children}</body></html>`. The
 * top-nav `SiteHeader` lives in the `(main)` route-group layout (so the
 * standalone `app/preview/*` routes render with no chrome). No sidebar, no shell.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
