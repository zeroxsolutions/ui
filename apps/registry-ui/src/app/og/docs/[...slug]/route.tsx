import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { docsPageImage, source } from '@/lib/source';
import { docsShareImageRoute } from '@/routes/app-routes';

export const revalidate = false;
export const dynamicParams = false;

/** A share image is 1200 by 630, the size Open Graph readers crop to. */
const SIZE = { width: 1200, height: 630 };

// The dark theme's `--background`, `--foreground` and `--muted-foreground` from `styles.css`, as hex:
// the image renderer reads no CSS variables. A change to those tokens is copied here by hand.
const BACKGROUND = '#0a0a0a';
const FOREGROUND = '#fafafa';
const MUTED_FOREGROUND = '#a1a1a1';

/**
 * Every docs page's share image, listed so each is drawn once at build. A page cannot carry an
 * `opengraph-image` file here: Next refuses one inside the optional catch-all `[[...slug]]`.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: docsPageImage(page).segments }));
}

/** A docs page's share image: the site's name over the page's title and description. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<Response> {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page || docsPageImage(page).url !== docsShareImageRoute.build({ slug: slug.join('/') })) notFound();

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: BACKGROUND,
        color: FOREGROUND,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, color: MUTED_FOREGROUND }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill={FOREGROUND}>
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="9" width="6" height="6" rx="1" />
          <rect x="16" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="16" width="6" height="6" rx="1" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
        </svg>
        ZeroXSolutions UI
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 72 }}>{page.data.title}</div>
        <div style={{ fontSize: 32, color: MUTED_FOREGROUND }}>{page.data.description}</div>
      </div>
    </div>,
    SIZE,
  );
}
