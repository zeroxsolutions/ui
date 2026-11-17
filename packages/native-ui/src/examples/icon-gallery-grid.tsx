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

/** A tile's width and height, `w-24 h-24`, in the pixels the grid's columns and rows are counted in. */
const TILE_SIZE = 96;

/** `glyph`'s export name, as the icon's file declares it: `arrow-up` gives `ArrowUpIcon`. */
function iconExportName(glyph: string): string {
  return `${glyph
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}Icon`;
}

/**
 * The component the module of `icon` exports, asked for as its tile first draws, so a module is evaluated only for
 * an icon the grid shows.
 */
function iconComponentOf(icon: IconGalleryGridIcon): ComponentType<AnimatedIconProps> | undefined {
  const exports = lucideIconModules(icon.module) as Record<string, ComponentType<AnimatedIconProps> | undefined>;
  return exports[iconExportName(icon.glyph)];
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
  const Glyph = iconComponentOf(icon);
  return (
    <Pressable
      role="button"
      aria-label={icon.glyph}
      aria-selected={picked}
      {...iconTrigger([handle], { onFocus: focus.onFocus })}
      onBlur={focus.onBlur}
      onPress={() => onPick(icon.name)}
      className={cn(
        'h-24 w-24 items-center gap-2 rounded-md px-1 py-3',
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
  /** What the reader typed in the docs page's search box, already read as a glyph name (`arrow-up`). */
  query: string;
  /** The item name of the icon last tapped, whose tile is marked; `undefined` before a tap. */
  picked: string | undefined;
  /** Called with the item name of the icon tapped. */
  onPick: (name: string) => void;
}

/**
 * The lucide set's icons whose glyph holds `query`, under the set's name, in a list that fills the height it is
 * given and scrolls itself.
 * The list draws only the rows near what it shows, so an icon, with its motion, is mounted as it is scrolled to.
 */
function IconGalleryGrid({ query, picked, onPick }: IconGalleryGridProps): ReactNode {
  const [width, setWidth] = useState(0);
  const columns = Math.max(1, Math.floor(width / TILE_SIZE));
  const shown = ICONS.filter(({ glyph }) => glyph.includes(query));

  return (
    <View className="flex-1 gap-3">
      <Text role="heading" className="font-sans-semibold">
        {SET}
      </Text>
      <View className="flex-1" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {shown.length === 0 ? (
          <Text className="text-muted-foreground">No icon has a name holding &quot;{query}&quot;.</Text>
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
            // Every row is one tile tall, so the list knows its whole height before it draws a row. Without it the
            // list grows only as rows are measured, and a browser that sends no scroll event once the list is at the
            // end of what it has drawn leaves it there.
            getItemLayout={(_rows, row) => ({ length: TILE_SIZE, offset: TILE_SIZE * row, index: row })}
          />
        )}
      </View>
    </View>
  );
}

export { IconGalleryGrid };
