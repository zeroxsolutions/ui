import type { ComponentProps, ReactNode } from 'react';

/**
 * The ZUI mark: a 3x3 grid of modules with the centre and the two anti-diagonal corners
 * left out. It draws in the text colour around it, so it follows the theme; it is decorative, and
 * the link or heading around it carries the name.
 */
function SiteLogo(props: ComponentProps<'svg'>): ReactNode {
  return (
    <svg data-slot="site-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="9" width="6" height="6" rx="1" />
      <rect x="16" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="16" width="6" height="6" rx="1" />
      <rect x="16" y="16" width="6" height="6" rx="1" />
    </svg>
  );
}

export { SiteLogo };
