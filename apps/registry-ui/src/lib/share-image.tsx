import { ImageResponse } from 'next/og';

import { SiteLogo } from '@/components/general/site-logo';

/** A share image is 1200 by 630, the size Open Graph readers crop to. */
const SIZE = { width: 1200, height: 630 };

// The dark theme's `--background`, `--foreground` and `--muted-foreground` from `styles.css`, as hex:
// the image renderer reads no CSS variables. A change to those tokens is copied here by hand.
const BACKGROUND = '#0a0a0a';
const FOREGROUND = '#fafafa';
const MUTED_FOREGROUND = '#a1a1a1';

/** A page's share image: the site's name over the page's title and description. */
export function shareImage({ title, description }: { title: string; description?: string }): ImageResponse {
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
        <SiteLogo width={40} height={40} style={{ color: FOREGROUND }} />
        ZUI
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 72 }}>{title}</div>
        <div style={{ fontSize: 32, color: MUTED_FOREGROUND }}>{description}</div>
      </div>
    </div>,
    SIZE,
  );
}
