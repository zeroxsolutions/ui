'use client';

import { useTheme } from 'next-themes';
import {
  Suspense,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';

import { useCurrentStyle } from '@zeroxsolutions/ui/site/hooks/use-current-style';
import { nativePreviewSrc, nativePreviewTitle, previewHeightOf, previewTheme } from '../../lib/native-preview';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import { Spinner } from '@zeroxsolutions/ui/registry/bases/base-ui/ui/spinner';

/** The frame's height, in CSS pixels, until the preview posts its own: the web preview stage's `h-72`. */
const FALLBACK_HEIGHT = 288;

/** The node the Expo web export mounts the preview in; a page loaded into the frame without it is not the preview. */
const PREVIEW_ROOT_ID = 'root';

/**
 * How long a frame may take to post its height before it reads as failed. The preview loads its bundle
 * and its fonts before it draws, and a demo that throws still draws its error and posts.
 */
const DRAW_TIMEOUT_MS = 15_000;

/** What a page holds a frame by, to post its demo a message. */
interface NativePreviewFrameHandle {
  /**
   * Posts `message` to the demo, for the page's own origin only. A message posted before the frame is drawn, or
   * while it loads another style or mode, is lost, so a demo that wants one asks for it once it listens.
   */
  post(message: unknown): void;
}

/** What a page that talks to its demo hands the frame. */
interface NativePreviewFrameChannel {
  /** Receives the handle the page posts to the demo through. */
  ref?: Ref<NativePreviewFrameHandle>;
  /** Called with each message the demo posts on the page's origin, other than its height. */
  onMessage?: (data: unknown) => void;
}

interface NativePreviewFrameProps extends NativePreviewFrameChannel {
  /** The engine of the page, whose preview app draws the demo. */
  engine: NativeEngine;
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
}

/**
 * A native demo drawn by the page's engine's native preview, in a frame as tall as the demo, in the style the page
 * shows and the site's light or dark mode. A change of either loads the frame again. It shows a spinner
 * until the demo has drawn, and says so, with a link to the preview's own page, if it never does. A page that
 * talks to its demo posts through `ref` and hears it through `onMessage`.
 */
function NativePreviewFrame(props: NativePreviewFrameProps): ReactNode {
  return (
    // The style is read from the search params, and the mode once the page has hydrated; until both
    // are known the frame is left out, so it loads once, in the reader's style and mode.
    <Suspense fallback={<NativePreviewFrameLoading />}>
      <NativePreviewFrameFromPage {...props} />
    </Suspense>
  );
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function NativePreviewFrameFromPage({ engine, demo, ref, onMessage }: NativePreviewFrameProps): ReactNode {
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
      src={nativePreviewSrc({
        engine,
        style,
        demo,
        theme: previewTheme(resolvedTheme),
      })}
      title={nativePreviewTitle(demo)}
      ref={ref}
      onMessage={onMessage}
    />
  );
}

/** Where the frame is with the page it was last pointed at. */
type FrameStatus = 'loading' | 'drawn' | 'failed';

interface NativePreviewFrameDocumentProps extends NativePreviewFrameChannel {
  src: string;
  title: string;
}

function NativePreviewFrameDocument({ src, title, ref, onMessage }: NativePreviewFrameDocumentProps): ReactNode {
  const frame = useRef<HTMLIFrameElement>(null);
  // Kept across a change of `src`, so a new style or mode reloads the frame without it jumping back to
  // the fallback height first.
  const [height, setHeight] = useState(FALLBACK_HEIGHT);
  const [outcome, setOutcome] = useState<{
    src: string;
    status: Exclude<FrameStatus, 'loading'>;
  }>();
  const status: FrameStatus = outcome?.src === src ? outcome.status : 'loading';

  useImperativeHandle(
    ref,
    () => ({ post: (message) => frame.current?.contentWindow?.postMessage(message, window.location.origin) }),
    [],
  );

  useEffect(() => {
    const receive = (event: MessageEvent): void => {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin) return;
      const posted = previewHeightOf(event.data);
      if (posted === undefined) {
        onMessage?.(event.data);
        return;
      }
      setHeight(posted);
      setOutcome({ src, status: 'drawn' });
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [src, onMessage]);

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setOutcome({ src, status: 'failed' }), DRAW_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src, status]);

  // The preview is served from the site's own origin; a frame whose document the page cannot read holds
  // the browser's error page instead, and one with no mount node holds the site's 404 page.
  const onLoad = (): void => {
    const loaded = frame.current?.contentDocument;
    if (loaded === null || (loaded && !loaded.getElementById(PREVIEW_ROOT_ID))) setOutcome({ src, status: 'failed' });
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
        // Under the spinner it would still take focus and be read out, though nothing in it can be seen.
        inert={status === 'loading'}
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
export type { NativePreviewFrameHandle };
