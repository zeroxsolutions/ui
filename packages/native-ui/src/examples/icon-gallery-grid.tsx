import { useRef, useState, type ComponentType, type ReactNode } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useFocusVisible } from '@/lib/focus-visible';
import { iconTrigger, type AnimatedIconProps, type IconHandle } from '@/lib/icon-motion';
import { cn } from '@/lib/utils';

import { lucideIconModules } from './lucide-icon-modules';

/** One icon of the gallery: its registry item, its glyph, and the path its module is asked for by. */
interface IconGalleryGridIcon {
  name: string;
  glyph: string;
  module: string;
}

/** The set whose folder {@link lucideIconModules} reads, which heads the grid. */
const SET = 'lucide';

/** A module path `./copy-icon.tsx` and the glyph it names. */
const ICON_MODULE = /^\.\/(.+)-icon\.tsx$/;

/** Every icon of the set, by glyph. */
const ICONS: IconGalleryGridIcon[] = lucideIconModules
  .keys()
  .flatMap((module) => {
    const glyph = ICON_MODULE.exec(module)?.[1];
    return glyph === undefined ? [] : [{ name: `${SET}-${glyph}-icon`, glyph, module }];
  })
  .sort((a, b) => a.glyph.localeCompare(b.glyph));

/** A tile's width, `w-24`, in the pixels the grid's columns are counted in. */
const TILE_WIDTH = 96;

/**
 * The component an icon's module exports, asked for as its tile first draws, so a module is evaluated only for an
 * icon the grid shows.
 */
function iconComponentOf(module: string): ComponentType<AnimatedIconProps> | undefined {
  const exports = lucideIconModules(module) as Record<string, unknown>;
  return Object.values(exports).find((value) => typeof value === 'function') as
    | ComponentType<AnimatedIconProps>
    | undefined;
}

/**
 * The icons whose glyph holds `query`, read as a glyph name: lower case, its words joined by `-`, as the docs
 * page's own count reads it, so the grid and the count agree.
 */
function iconGalleryGridMatches(query: string): IconGalleryGridIcon[] {
  const wanted = query.trim().toLowerCase().split(/\s+/).join('-');
  return ICONS.filter(({ glyph }) => glyph.includes(wanted));
}

interface IconGalleryGridTileProps {
  icon: IconGalleryGridIcon;
  picked: boolean;
  onPick: (name: string) => void;
}

/** A tile that plays its icon on press-in and on focus, and picks it on a tap. */
function IconGalleryGridTile({ icon, picked, onPick }: IconGalleryGridTileProps): ReactNode {
  const handle = useRef<IconHandle>(null);
  const focus = useFocusVisible();
  const Glyph = iconComponentOf(icon.module);
  return (
    <Pressable
      role="button"
      aria-label={icon.glyph}
      aria-selected={picked}
      {...iconTrigger([handle], { onFocus: focus.onFocus })}
      onBlur={focus.onBlur}
      onPress={() => onPick(icon.name)}
      className={cn(
        'w-24 items-center gap-2 rounded-md px-1 py-3',
        picked && 'bg-muted',
        focus.focusVisible && 'ring-ring ring-2',
      )}
    >
      {Glyph && <Icon as={Glyph} ref={handle} className="size-6" />}
      <Text numberOfLines={2} className="text-muted-foreground text-center text-xs">
        {icon.glyph}
      </Text>
    </Pressable>
  );
}

interface IconGalleryGridProps {
  /** What the reader typed in the docs page's search box. */
  query: string;
  /** The item name of the icon last tapped, whose tile is marked; `undefined` before a tap. */
  picked: string | undefined;
  /** Called with the item name of the icon tapped. */
  onPick: (name: string) => void;
}

/**
 * The lucide set's icons whose name holds `query`, under the set's name, in a list of its own height that scrolls.
 * The list draws only the rows near what it shows, so an icon, with its motion, is mounted as it is scrolled to.
 */
function IconGalleryGrid({ query, picked, onPick }: IconGalleryGridProps): ReactNode {
  const [width, setWidth] = useState(0);
  const columns = Math.max(1, Math.floor(width / TILE_WIDTH));
  const shown = iconGalleryGridMatches(query);

  return (
    <View className="gap-3">
      <Text role="heading" className="font-sans-semibold">
        {SET}
      </Text>
      <View className="h-96" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {shown.length === 0 ? (
          <Text className="text-muted-foreground">No icon has a name holding &quot;{query.trim()}&quot;.</Text>
        ) : (
          <FlatList
            // A list cannot change its column count in place, so a new count draws a new list.
            key={columns}
            data={shown}
            numColumns={columns}
            keyExtractor={(icon) => icon.name}
            renderItem={({ item }) => <IconGalleryGridTile icon={item} picked={item.name === picked} onPick={onPick} />}
            initialNumToRender={columns * 4}
            maxToRenderPerBatch={columns * 2}
            windowSize={3}
          />
        )}
      </View>
    </View>
  );
}

export { IconGalleryGrid };
