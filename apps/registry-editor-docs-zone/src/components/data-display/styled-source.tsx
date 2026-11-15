'use client';

import { Suspense, type ReactNode } from 'react';

import { useCurrentStyle } from '@zeroxsolutions/ui/site/hooks/use-current-style';

/** A file as each web style other than the default writes it, with its lines highlighted, as JSON. */
export type StyleSources = Record<string, { code: string; lines: string }>;

interface StyledSourceProps {
  /** The default style's card, which a style missing from `byStyle` writes the same. */
  fallback: ReactNode;
  /** Each other style's card. */
  byStyle: Record<string, ReactNode>;
}

/** The card of the style the page shows; the default's while the page reads its search params. */
function StyledSource({ fallback, byStyle }: StyledSourceProps): ReactNode {
  return (
    <Suspense fallback={fallback}>
      <StyledSourceInStyle fallback={fallback} byStyle={byStyle} />
    </Suspense>
  );
}

function StyledSourceInStyle({ fallback, byStyle }: StyledSourceProps): ReactNode {
  return byStyle[useCurrentStyle('web')] ?? fallback;
}

export { StyledSource };
