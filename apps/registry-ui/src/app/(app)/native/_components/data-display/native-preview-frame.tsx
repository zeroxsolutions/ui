'use client';

import { useTheme } from 'next-themes';
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';

import { useCurrentStyle } from '@/hooks/use-current-style';
import { nativePreviewSrc, previewHeightOf, previewTheme } from '@/lib/native-preview';
import { Spinner } from '@/registry/bases/base-ui/ui/spinner';

/** The frame's height, in CSS pixels, until the preview posts its own: the web preview stage's `h-72`. */
const FALLBACK_HEIGHT = 288;

/**
 * How long a frame may take to post its height before it reads as failed. The preview loads its bundle
 * and its fonts before it draws, and a demo that throws still draws its error and posts.
 */
const DRAW_TIMEOUT_MS = 15_000;

interface NativePreviewFrameProps {
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
}

/**
 * A native demo drawn by the native preview, in a frame as tall as the demo, in the style the page
 * shows and the site's light or dark mode. A change of either loads the frame again. It shows a spinner
 * until the demo has drawn, and says so, with a link to the preview's own page, if it never does.
 */
function NativePreviewFrame({ demo }: NativePreviewFrameProps): ReactNode {
  return (
    // The style is read from the search params, and the mode once the page has hydrated; until both
    // are known the frame is left out, so it loads once, in the reader's style and mode.
    <Suspense fallback={<NativePreviewFrameLoading />}>
      <NativePreviewFrameFromPage demo={demo} />
    </Suspense>
  );
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function NativePreviewFrameFromPage({ demo }: NativePreviewFrameProps): ReactNode {
  const style = useCurrentStyle('native');
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  if (!hydrated) return <NativePreviewFrameLoading />;

  return (
    <NativePreviewFrameDocument
      src={nativePreviewSrc({ style, demo, theme: previewTheme(resolvedTheme) })}
      title={`${demo} preview`}
    />
  );
}

/** Where the frame is with the page it was last pointed at. */
type FrameStatus = 'loading' | 'drawn' | 'failed';

function NativePreviewFrameDocument({ src, title }: { src: string; title: string }): ReactNode {
  const frame = useRef<HTMLIFrameElement>(null);
  // Kept across a change of `src`, so a new style or mode reloads the frame without it jumping back to
  // the fallback height first.
  const [height, setHeight] = useState(FALLBACK_HEIGHT);
  const [outcome, setOutcome] = useState<{ src: string; status: Exclude<FrameStatus, 'loading'> }>();
  const status: FrameStatus = outcome?.src === src ? outcome.status : 'loading';

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin) return;
      const posted = previewHeightOf(event.data);
      if (posted === undefined) return;
      setHeight(posted);
      setOutcome({ src, status: 'drawn' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [src]);

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setOutcome({ src, status: 'failed' }), DRAW_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src, status]);

  // The preview is served from the site's own origin; a frame whose document the page cannot read holds
  // the browser's error page instead.
  const onLoad = (): void => {
    if (frame.current?.contentDocument === null) setOutcome({ src, status: 'failed' });
  };

  return (
    <div
      data-slot="native-preview-frame"
      data-status={status}
      style={{ '--native-preview-height': `${height}px` } as CSSProperties}
      className="relative"
    >
      <iframe
        // A new element per page, so a message from the page the frame held before is not taken for one
        // from the page it holds now.
        key={src}
        ref={frame}
        src={src}
        title={title}
        onLoad={onLoad}
        className="block h-(--native-preview-height) w-full in-data-[status=failed]:invisible"
      />
      {status === 'loading' && (
        <div className="bg-background absolute inset-0 flex items-center justify-center">
          <Spinner aria-label="Loading the preview" className="text-muted-foreground size-5" />
        </div>
      )}
      {status === 'failed' && (
        <div
          role="alert"
          className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm"
        >
          <p>The preview did not load.</p>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Open it on its own page
          </a>
        </div>
      )}
    </div>
  );
}

function NativePreviewFrameLoading(): ReactNode {
  return (
    <div data-slot="native-preview-frame" data-status="loading" className="flex h-72 items-center justify-center">
      <Spinner aria-label="Loading the preview" className="text-muted-foreground size-5" />
    </div>
  );
}

export { NativePreviewFrame };
