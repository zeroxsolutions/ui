'use client';

import { Suspense, type ReactNode } from 'react';

import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { useCurrentStyle } from '@/hooks/use-current-style';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import type { PlatformStyle } from '@/types/platform';

interface NativeCopyPageButtonProps {
  /** The page as Markdown in each native style, which the server renders as the page is built. */
  markdown: Record<PlatformStyle<'native'>, string>;
}

/** A native page's Copy page: it copies the page's Markdown in the style the page shows. */
function NativeCopyPageButton({ markdown }: NativeCopyPageButtonProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page shows the default style.
    <Suspense fallback={<CopyPageButton markdown={markdown[DEFAULT_PLATFORM_STYLE.native]} />}>
      <NativeCopyPageButtonFromUrl markdown={markdown} />
    </Suspense>
  );
}

function NativeCopyPageButtonFromUrl({ markdown }: NativeCopyPageButtonProps): ReactNode {
  return <CopyPageButton markdown={markdown[useCurrentStyle('native')]} />;
}

function CopyPageButton({ markdown }: { markdown: string }): ReactNode {
  return <CopyButton value={markdown} label="Copy page" variant="secondary" size="icon-sm" />;
}

export { NativeCopyPageButton };
