import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';

import { Text } from '@/components/ui/text';

import {
  iconGalleryFrame,
  iconGalleryQueryOf,
  postIconGalleryPick,
  postIconGalleryReady,
  type IconGalleryMessageEvent,
} from './icon-gallery-channel';

// Its own chunk on the web: every style's demos share one bundle, which would otherwise carry each style's copy of
// the whole set to every page that frames any demo.
const IconGalleryGrid = lazy(() =>
  import('./icon-gallery-grid').then(({ IconGalleryGrid: Grid }) => ({ default: Grid })),
);

/**
 * Every animated icon of the lucide set, each in a tile that plays it on press-in and on focus. In a docs page's
 * frame it takes its search from the page's search box and tells the page which icon was tapped, for the page's
 * install line; on a device it shows every icon.
 */
function IconGalleryDemo(): ReactNode {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string>();
  const [frame] = useState(iconGalleryFrame);

  useEffect(() => {
    if (!frame) return;
    const onMessage = (event: IconGalleryMessageEvent): void => {
      const posted = iconGalleryQueryOf(frame, event);
      if (posted !== undefined) setQuery(posted);
    };
    frame.addEventListener('message', onMessage);
    postIconGalleryReady(frame);
    return () => frame.removeEventListener('message', onMessage);
  }, [frame]);

  const pick = (name: string): void => {
    setPicked(name);
    if (frame) postIconGalleryPick(frame, name);
  };

  return (
    <Suspense fallback={<Text className="text-muted-foreground">Loading the icons</Text>}>
      <IconGalleryGrid query={query} picked={picked} onPick={pick} />
    </Suspense>
  );
}

export { IconGalleryDemo };
