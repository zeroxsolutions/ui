import { EMOJI_CATEGORIES, type EmojiDatum } from '@zeroxsolutions/fluent-emoji/catalog';
import {
  Clock,
  Coffee,
  Dumbbell,
  Flag,
  Hash,
  Leaf,
  Lightbulb,
  Plane,
  Search,
  Smile,
  type LucideIcon,
} from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { FlatList, View } from 'react-native';
import {
  EMOJI_PICKER_COLUMNS,
  emojiPickerRows,
  type EmojiPickerRow,
  type EmojiPickerSection,
} from '../../lib/emoji-picker-rows';
import { FluentEmoji } from '../../lib/fluent-emoji';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { InputGroup, InputGroupAddon, InputGroupInput, type InputGroupInputProps } from '../../ui/input-group';
import { TextClassContext } from '../../ui/text';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';

/** The nav's glyph per category. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  frequent: Clock,
  smileys_people: Smile,
  animals_nature: Leaf,
  food_drink: Coffee,
  travel_places: Plane,
  activities: Dumbbell,
  objects: Lightbulb,
  symbols: Hash,
  flags: Flag,
};

// The list hands these heights to FlatList's getItemLayout, which is how the nav scrolls to a header that has
// not been drawn yet, so each row is drawn at exactly its height here whatever the engine's rem.
/** A cell row: the 32px icon button and a 2px gap. */
const CELL_ROW_PX = 34;
const HEADER_PX = 28;

const HEIGHT_CLASSES = { sm: 'h-40', md: 'h-60', lg: 'h-80' } as const;

const SURFACE_CLASSES = { background: 'bg-background', card: 'bg-card', popover: 'bg-popover' } as const;

/** The colour of the surface the picker sits on, which its headings are drawn in. */
type EmojiPickerSurface = keyof typeof SURFACE_CLASSES;

interface EmojiPickerScroller {
  scrollToIndex: (index: number) => void;
}

/** The consumer's recently used emoji and the name its heading and nav item carry. */
interface EmojiPickerFrequent {
  /** The section heading and the nav item's accessible name, e.g. `Frequently used`. */
  name: string;
  /** Emoji glyphs, most recent first. An empty list keeps the nav item, disabled, and drops the section. */
  emojis: string[];
}

interface EmojiPickerContextValue {
  query: string;
  setQuery: (query: string) => void;
  select: (emoji: string) => void;
  /** The search matches, or null when nothing is searched. */
  results: EmojiDatum[] | null;
  navCategories: { id: string; name: string; disabled: boolean }[];
  active: string;
  scrollToCategory: (id: string) => void;
  rows: EmojiPickerRow[];
  headerIndices: number[];
  /** Set by EmojiPickerContent while it is mounted, so the nav in a sibling subtree can scroll its list. */
  scrollerRef: RefObject<EmojiPickerScroller | null>;
  surface: EmojiPickerSurface;
}

const EmojiPickerContext = createContext<EmojiPickerContextValue | null>(null);

function useEmojiPicker(): EmojiPickerContextValue {
  const context = useContext(EmojiPickerContext);
  if (!context) throw new Error('EmojiPicker parts must be used within <EmojiPicker>');
  return context;
}

interface EmojiPickerProps {
  /** Called with the chosen emoji glyph. */
  onSelect: (emoji: string) => void;
  /**
   * The frequent row, shown first and given its own nav item. The consumer owns the list and its persistence;
   * the picker stores nothing. Omitted, the picker has no frequent section and no nav item for one.
   */
  frequent?: EmojiPickerFrequent;
  /**
   * The surface the picker sits on, `background` (default), `card` or `popover`, whose colour the headings are
   * drawn in so the rows scrolling under them stay hidden.
   */
  surface?: EmojiPickerSurface;
  /** The parts: `EmojiPickerSearch`, `EmojiPickerContent` (holding `EmojiPickerEmpty`) and `EmojiPickerNav`. */
  children: ReactNode;
}

/**
 * A searchable, categorized emoji list with an optional frequent row and a category nav, over the catalog of
 * `@zeroxsolutions/fluent-emoji` drawn in its Fluent 3D artwork. The list mounts only the rows near the screen,
 * so opening the catalog of about 1900 emoji draws one screenful and fetches only the artwork in view.
 *
 * The root owns the query, the active category and the rows, and draws nothing of its own; the consumer
 * composes the parts:
 *
 *   <EmojiPicker onSelect={setEmoji}>
 *     <EmojiPickerSearch />
 *     <EmojiPickerContent>
 *       <EmojiPickerEmpty>
 *         <Empty><EmptyHeader><EmptyTitle>No emoji found</EmptyTitle></EmptyHeader></Empty>
 *       </EmojiPickerEmpty>
 *     </EmojiPickerContent>
 *     <EmojiPickerNav aria-label="Categories" />
 *   </EmojiPicker>
 */
function EmojiPicker({ onSelect, frequent, surface = 'background', children }: EmojiPickerProps): ReactNode {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('smileys_people');

  const searched = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!searched) return null;
    return EMOJI_CATEGORIES.flatMap((category) => category.emojis.filter((emoji) => emoji.k.includes(searched)));
  }, [searched]);

  const sections = useMemo<EmojiPickerSection[]>(() => {
    const head =
      frequent && frequent.emojis.length > 0
        ? [{ id: 'frequent', name: frequent.name, emojis: frequent.emojis.map((e) => ({ e, n: e, k: '' })) }]
        : [];
    return [...head, ...EMOJI_CATEGORIES];
  }, [frequent]);

  const navCategories = useMemo(
    () => [
      ...(frequent ? [{ id: 'frequent', name: frequent.name, disabled: frequent.emojis.length === 0 }] : []),
      ...EMOJI_CATEGORIES.map((category) => ({ id: category.id, name: category.name, disabled: false })),
    ],
    [frequent],
  );

  const { rows, headerIndices } = useMemo(() => emojiPickerRows(sections, results), [sections, results]);
  const scrollerRef = useRef<EmojiPickerScroller | null>(null);

  const scrollToCategory = useCallback(
    (id: string) => {
      setActive(id);
      const index = rows.findIndex((row) => row.type === 'header' && row.id === id);
      if (index >= 0) scrollerRef.current?.scrollToIndex(index);
    },
    [rows],
  );

  const context = useMemo<EmojiPickerContextValue>(
    () => ({
      query,
      setQuery,
      select: onSelect,
      results,
      navCategories,
      active,
      scrollToCategory,
      rows,
      headerIndices,
      scrollerRef,
      surface,
    }),
    [query, onSelect, results, navCategories, active, scrollToCategory, rows, headerIndices, surface],
  );

  return <EmojiPickerContext.Provider value={context}>{children}</EmojiPickerContext.Provider>;
}

type EmojiPickerSearchProps = Omit<InputGroupInputProps, 'value' | 'defaultValue' | 'onChange' | 'onChangeText'>;

/**
 * The search field, bound to the picker's query, over InputGroup with a search icon before it. `placeholder`
 * defaults to `Search` and `aria-label` to `Search emoji`; `className` places the group. A query matches an
 * emoji whose catalog search text holds it, trimmed and in any case.
 */
function EmojiPickerSearch({
  className,
  placeholder = 'Search',
  'aria-label': ariaLabel = 'Search emoji',
  ...props
}: EmojiPickerSearchProps): ReactNode {
  const { query, setQuery } = useEmojiPicker();
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Icon as={Search} />
      </InputGroupAddon>
      <InputGroupInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...props}
      />
    </InputGroup>
  );
}

/**
 * A section heading, the frequent row's name or a category's, drawn as the preset's group labels in the colour of
 * the picker's `surface` (the page background outside a picker) so the rows scrolling under it stay hidden. A
 * string child is set in a Text.
 */
function EmojiPickerGroupLabel({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const surface = useContext(EmojiPickerContext)?.surface ?? 'background';
  return (
    <TextClassContext.Provider value="text-muted-foreground text-xs">
      <View className={cn('justify-center px-2 py-1.5', SURFACE_CLASSES[surface], className)} {...props}>
        {asText(children)}
      </View>
    </TextClassContext.Provider>
  );
}

type EmojiPickerContentProps = Omit<ComponentProps<typeof View>, 'style'> & {
  /** The list's height: `sm`, `md` (default) or `lg`. */
  size?: keyof typeof HEIGHT_CLASSES;
};

/**
 * The scrolling list of emoji, eight to a row under a heading per category that sticks to the top while its
 * rows scroll under it, in a box of the `size` height placed by `className`. Only the rows near the screen
 * mount. `children` follow the rows, which is where an `EmojiPickerEmpty` goes. A new search starts the list
 * back at the top.
 */
function EmojiPickerContent({ className, children, size = 'md', ...props }: EmojiPickerContentProps): ReactNode {
  const { results, rows, headerIndices, scrollerRef } = useEmojiPicker();
  const listRef = useRef<FlatList<EmojiPickerRow>>(null);

  const offsets = useMemo(() => {
    let offset = 0;
    return rows.map((row) => {
      const top = offset;
      offset += row.type === 'header' ? HEADER_PX : CELL_ROW_PX;
      return top;
    });
  }, [rows]);

  useEffect(() => {
    scrollerRef.current = {
      scrollToIndex: (index) => listRef.current?.scrollToIndex({ index, animated: true }),
    };
    return () => {
      scrollerRef.current = null;
    };
  }, [scrollerRef]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [results]);

  return (
    <View className={cn(HEIGHT_CLASSES[size], className)} {...props}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(row) => row.key}
        getItemLayout={(_data, index) => ({
          length: rows[index]?.type === 'header' ? HEADER_PX : CELL_ROW_PX,
          offset: offsets[index] ?? 0,
          index,
        })}
        stickyHeaderIndices={headerIndices}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-3"
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <EmojiPickerGroupLabel style={{ height: HEADER_PX }}>{item.name}</EmojiPickerGroupLabel>
          ) : (
            <View className="flex-row items-center" style={{ height: CELL_ROW_PX }}>
              {Array.from({ length: EMOJI_PICKER_COLUMNS }, (_, column) => (
                <View key={column} className="flex-1 items-center">
                  {item.emojis[column] && <EmojiPickerCell emoji={item.emojis[column]} />}
                </View>
              ))}
            </View>
          )
        }
        ListFooterComponent={<>{children}</>}
      />
    </View>
  );
}

/**
 * The no-results state: draws its `children` (an Empty the consumer composes) only while a search matches
 * nothing. Place it in `EmojiPickerContent`.
 */
function EmojiPickerEmpty(props: ComponentProps<typeof View>): ReactNode {
  const { results } = useEmojiPicker();
  if (!results || results.length > 0) return null;
  return <View {...props} />;
}

/**
 * The category nav, a single-choice ToggleGroup joined across the picker's width: one icon item per category,
 * named by the category, which scrolls the list to that category's heading. The active category stays chosen
 * when pressed again. Give the group its own `aria-label`. Hidden while searching.
 */
function EmojiPickerNav({
  className,
  ...props
}: Omit<ComponentProps<typeof ToggleGroup>, 'type' | 'value' | 'onValueChange' | 'children'>): ReactNode {
  const { results, navCategories, active, scrollToCategory } = useEmojiPicker();
  if (results) return null;
  return (
    <ToggleGroup
      type="single"
      spacing={0}
      className={cn('w-full', className)}
      value={active}
      onValueChange={(picked) => {
        if (picked && picked !== active) scrollToCategory(picked);
      }}
      {...props}
    >
      {navCategories.map((category) => (
        <ToggleGroupItem
          key={category.id}
          value={category.id}
          disabled={category.disabled}
          aria-label={category.name}
          // A toggle's minimum width and padding would push nine items past the picker; flex-1 shares it instead.
          className="min-w-0 flex-1 px-0"
        >
          <Icon as={CATEGORY_ICONS[category.id] ?? Smile} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** One emoji, a ghost icon button named by the emoji's name that hands its glyph to the picker's `onSelect`. */
function EmojiPickerCell({ emoji }: { emoji: EmojiDatum }): ReactNode {
  const { select } = useEmojiPicker();
  return (
    <Button size="icon" variant="ghost" aria-label={emoji.n} onPress={() => select(emoji.e)}>
      <FluentEmoji glyph={emoji.e} name={emoji.n} aria-hidden className="size-6" />
    </Button>
  );
}

export { EmojiPicker, EmojiPickerContent, EmojiPickerEmpty, EmojiPickerGroupLabel, EmojiPickerNav, EmojiPickerSearch };
export type {
  EmojiPickerContentProps,
  EmojiPickerFrequent,
  EmojiPickerProps,
  EmojiPickerSearchProps,
  EmojiPickerSurface,
};
