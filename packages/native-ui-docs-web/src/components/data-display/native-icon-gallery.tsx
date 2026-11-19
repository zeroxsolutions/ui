'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

import { ComponentPreview } from '@zeroxsolutions/ui/site/components/data-display/component-preview';
import { IconGallery } from '@zeroxsolutions/ui/site/components/data-display/icon-gallery';
import type { IconSet } from '@zeroxsolutions/ui/site/lib/icon-sets';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import {
  ICON_GALLERY_DEMO,
  iconGalleryMessageOf,
  iconGalleryQueryMessage,
  nativeIconUsage,
} from '../../lib/native-icon-gallery';
import { NativePreviewFrame, type NativePreviewFrameHandle } from './native-preview-frame';

interface NativeIconGalleryFrameProps {
  engine: NativeEngine;
  /** What the reader typed in the page's search box, which the demo narrows its grid to. */
  query: string;
  /** The item name of the icon picked, whose tile the demo marks. */
  picked: string | undefined;
  /** Picks the icon with this item name, tapped in the demo. */
  onPick: (name: string) => void;
}

/**
 * The gallery demo in the engine's preview, which draws the icons. It sends the demo the search and the pick once
 * the demo says it listens, and again as either changes, and hands on the icon tapped there.
 */
function NativeIconGalleryFrame({ engine, query, picked, onPick }: NativeIconGalleryFrameProps): ReactNode {
  const frame = useRef<NativePreviewFrameHandle>(null);
  const ready = useRef(false);
  // The latest of each, read by a message handler the frame keeps for as long as it shows one page.
  const latest = useRef({ query, picked, onPick });
  useLayoutEffect(() => {
    latest.current = { query, picked, onPick };
  });

  useEffect(() => {
    if (ready.current) frame.current?.post(iconGalleryQueryMessage(query, picked));
  }, [query, picked]);

  const onMessage = useCallback((data: unknown) => {
    const message = iconGalleryMessageOf(data);
    if (message?.kind === 'ready') {
      ready.current = true;
      frame.current?.post(iconGalleryQueryMessage(latest.current.query, latest.current.picked));
    } else if (message?.kind === 'pick') {
      latest.current.onPick(message.name);
    }
  }, []);

  return (
    <ComponentPreview>
      <NativePreviewFrame ref={frame} engine={engine} demo={ICON_GALLERY_DEMO} onMessage={onMessage} />
    </ComponentPreview>
  );
}

interface NativeIconGalleryProps {
  /** The engine the page is read under, whose preview app draws the icons. */
  engine: NativeEngine;
  sets: IconSet[];
}

/**
 * The gallery of the native icons: the page's search box and install panel, around the engine's preview drawing
 * the icons in a frame. On the client side, since its grid is a function.
 */
function NativeIconGallery({ engine, sets }: NativeIconGalleryProps): ReactNode {
  return (
    <IconGallery
      sets={sets}
      renderGrid={({ query, picked, onPick }) => (
        <NativeIconGalleryFrame engine={engine} query={query} picked={picked} onPick={onPick} />
      )}
      usage={nativeIconUsage}
    />
  );
}

export { NativeIconGallery };
