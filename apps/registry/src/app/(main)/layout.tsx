import { SiteHeader } from '@/components/docs';

/**
 * The docs shell for every route under `(main)/` - a sticky top-nav `SiteHeader`
 * over the routed page. The standalone `app/preview/*` routes sit outside this
 * group, so they render raw (no header) for use as iframe sources.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh">
      <SiteHeader />
      {children}
    </div>
  );
}
