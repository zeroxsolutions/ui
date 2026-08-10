import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  EMOJI_CATEGORIES,
  FluentEmoji,
  type EmojiDatum,
} from '@zeroxsolutions/fluent-emoji';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Clock,
  Coffee,
  Dumbbell,
  Flag,
  Hash,
  Leaf,
  Lightbulb,
  Plane,
  SearchX,
  Smile,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
import { SearchInput } from './search-input';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

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

/** Default heading + nav name for the frequent row; override via `frequentLabel`. */
const DEFAULT_FREQUENT_LABEL = 'Frequently used';

/** Cells per grid row, and the fixed row metrics the window is computed from.
 * The grid is uniform - a cell is a `Button size="icon"` (`size-9` = 36px) and
 * rows sit a `gap-0.5` (2px) apart - and the viewport height is the `size`
 * variant (below), so the visible window is pure arithmetic: no element
 * measurement (which reads 0 in jsdom) and no ResizeObserver. */
const COLS = 8;
const CELL_ROW_HEIGHT = 38;
const HEADER_HEIGHT = 28;
const SIZE_PX = { sm: 160, md: 240, lg: 320 } as const;
/** Rows rendered beyond the viewport on each side, in px (~6 rows). */
const OVERSCAN_PX = 6 * CELL_ROW_HEIGHT;

interface EmojiSection {
  id: string;
  name: string;
  emojis: EmojiDatum[];
}

/** One virtual row: a sticky section heading or a row of up to `COLS` emoji. */
type EmojiRow =
  | { type: 'header'; key: string; id: string; name: string }
  | { type: 'cells'; key: string; emojis: EmojiDatum[] };

/** Flatten sections (or flat search results) into the virtualizer's row list. */
function buildRows(
  sections: EmojiSection[],
  results: EmojiDatum[] | null,
): { rows: EmojiRow[]; headerIndices: number[] } {
  const rows: EmojiRow[] = [];
  const headerIndices: number[] = [];
  const pushCells = (emojis: EmojiDatum[], keyBase: string) => {
    for (let i = 0; i < emojis.length; i += COLS) {
      rows.push({
        type: 'cells',
        key: `${keyBase}-${i}`,
        emojis: emojis.slice(i, i + COLS),
      });
    }
  };
  // Search view is a flat grid of matches - no section headers.
  if (results) {
    pushCells(results, 'search');
    return { rows, headerIndices };
  }
  for (const sec of sections) {
    headerIndices.push(rows.length);
    rows.push({
      type: 'header',
      key: `h-${sec.id}`,
      id: sec.id,
      name: sec.name,
    });
    pushCells(sec.emojis, sec.id);
  }
  return { rows, headerIndices };
}

interface Scroller {
  scrollToIndex: (index: number, opts?: { align?: 'start' }) => void;
}

interface EmojiPickerContextValue {
  query: string;
  setQuery: (q: string) => void;
  /** Forwards the chosen emoji to the consumer's onSelect. */
  select: (emoji: string) => void;
  /** Search results, or null when not searching. */
  results: EmojiDatum[] | null;
  navCategories: { id: string; name: string }[];
  active: string;
  scrollToCategory: (id: string) => void;
  hasFrequent: boolean;
  /** Flattened rows + the indices that are sticky headers. */
  rows: EmojiRow[];
  headerIndices: number[];
  /** The scrollable grid registers its virtualizer here so the nav can jump. */
  scrollerRef: React.RefObject<Scroller | null>;
}

const EmojiPickerContext = React.createContext<EmojiPickerContextValue | null>(
  null,
);

/** Read the picker state shared by the surrounding <EmojiPicker>. */
function useEmojiPicker(): EmojiPickerContextValue {
  const ctx = React.useContext(EmojiPickerContext);
  if (!ctx) {
    throw new Error('EmojiPicker parts must be used within <EmojiPicker>');
  }
  return ctx;
}

interface EmojiPickerProps {
  /** Called with the chosen emoji glyph. */
  onSelect: (emoji: string) => void;
  /**
   * Recently-used emoji glyphs shown in the frequent row. The consumer owns this
   * list and its persistence - the picker keeps no storage of its own.
   */
  frequent?: string[];
  /** Heading + nav name for the frequent row. Defaults to `'Frequently used'`. */
  frequentLabel?: string;
  /**
   * Compose the parts (`EmojiPickerSearch`, `EmojiPickerContent`,
   * `EmojiPickerNav`) to override copy or layout. Omit for the default picker.
   */
  children?: React.ReactNode;
}

/**
 * A searchable, categorized emoji grid with an optional frequent row and a
 * category nav - modelled on the LobeHub picker. The catalog and the Fluent 3D
 * artwork come from `@zeroxsolutions/fluent-emoji` (self-hosted, no third-party CDN);
 * the frequent row is consumer-supplied (`frequent`) - the picker holds no
 * persistence of its own.
 *
 * The grid is **windowed**: only the rows in (and near) the viewport mount, so
 * opening the ~1900-emoji catalog renders one screenful and fetches only the
 * artwork in view.
 *
 * Compound + context: the Root owns the state and the parts read it. Used bare
 * (`<EmojiPicker onSelect />`) it renders the default composition; compose the
 * parts to override any visible copy (every string is a part's `children`/prop
 * default, never frozen) - `<EmojiPickerEmpty>` overrides the no-results state.
 */
function EmojiPicker({
  onSelect,
  frequent = [],
  frequentLabel = DEFAULT_FREQUENT_LABEL,
  children,
}: EmojiPickerProps) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState('smileys_people');

  const q = query.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (!q) return null;
    const out: EmojiDatum[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const em of cat.emojis) if (em.k.includes(q)) out.push(em);
    }
    return out;
  }, [q]);

  const sections = React.useMemo<EmojiSection[]>(() => {
    const head: EmojiSection[] =
      frequent.length > 0
        ? [
            {
              id: 'frequent',
              name: frequentLabel,
              emojis: frequent.map((e) => ({ e, n: e, k: '' })),
            },
          ]
        : [];
    return [...head, ...EMOJI_CATEGORIES];
  }, [frequent, frequentLabel]);

  const navCategories = React.useMemo(
    () => [
      { id: 'frequent', name: frequentLabel },
      ...EMOJI_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
    ],
    [frequentLabel],
  );

  const { rows, headerIndices } = React.useMemo(
    () => buildRows(sections, results),
    [sections, results],
  );

  // The scrollable grid (in EmojiPickerContent) registers its virtualizer here;
  // the nav lives in a sibling subtree and jumps through this ref.
  const scrollerRef = React.useRef<Scroller | null>(null);

  const scrollToCategory = React.useCallback(
    (id: string) => {
      setActive(id);
      const idx = rows.findIndex((r) => r.type === 'header' && r.id === id);
      if (idx >= 0) scrollerRef.current?.scrollToIndex(idx, { align: 'start' });
    },
    [rows],
  );

  const ctx = React.useMemo<EmojiPickerContextValue>(
    () => ({
      query,
      setQuery,
      select: onSelect,
      results,
      navCategories,
      active,
      scrollToCategory,
      hasFrequent: frequent.length > 0,
      rows,
      headerIndices,
      scrollerRef,
    }),
    [
      query,
      onSelect,
      results,
      navCategories,
      active,
      scrollToCategory,
      frequent.length,
      rows,
      headerIndices,
    ],
  );

  return (
    <EmojiPickerContext.Provider value={ctx}>
      {children ?? (
        <React.Fragment>
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerNav />
        </React.Fragment>
      )}
    </EmojiPickerContext.Provider>
  );
}

type EmojiPickerSearchProps = Omit<
  React.ComponentProps<typeof SearchInput>,
  'value' | 'onChange'
> & {
  /** Override the default placeholder. */
  placeholder?: string;
  /** Override the default aria-label. */
  'aria-label'?: string;
};

/** Search box bound to the picker query. Copy is overridable via the props. */
function EmojiPickerSearch({
  className,
  placeholder = 'Search',
  'aria-label': ariaLabel = 'Search emoji',
  ...props
}: EmojiPickerSearchProps) {
  const { query, setQuery } = useEmojiPicker();
  return (
    <div data-slot="emoji-picker-search" className="px-2 py-1">
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
        {...props}
      />
    </div>
  );
}

/** Sticky section heading - this is what "Frequently used" / a category name is. */
function EmojiPickerGroupLabel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="emoji-picker-group-label"
      className={cn(
        'bg-popover px-2 py-1 text-muted-foreground text-sm font-medium',
        className,
      )}
      {...props}
    />
  );
}

type EmojiPickerEmptyProps = {
  /** Override the default no-results state. */
  children?: React.ReactNode;
};

/** No-results state. `children` overrides the default copy; place it in Content. */
function EmojiPickerEmpty({ children }: EmojiPickerEmptyProps) {
  return children ? (
    children
  ) : (
    <Empty data-slot="emoji-picker-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No emoji found</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

const emojiPickerContentVariants = cva('px-2', {
  variants: {
    size: {
      sm: 'h-40',
      md: 'h-60',
      lg: 'h-80',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type EmojiPickerContentProps = React.ComponentProps<typeof ScrollArea> &
  VariantProps<typeof emojiPickerContentVariants>;

/**
 * Windowed, scrollable grid body. While searching it shows the matches or -
 * when none - its `children` (an `EmojiPickerEmpty` override) or the default
 * empty state. Only the rows in (and near) the viewport mount; the section
 * header covering the top of the viewport is pinned.
 *
 * The window is plain arithmetic over fixed row heights and the known viewport
 * height (the `size` variant) - no element measurement, so it is correct under
 * jsdom (scroll starts at the top) and needs no virtualization library.
 */
function EmojiPickerContent({
  className,
  children,
  size = 'md',
  ...props
}: EmojiPickerContentProps) {
  const { results, rows, headerIndices, select, scrollerRef } =
    useEmojiPicker();

  const viewportHeight = SIZE_PX[size ?? 'md'];
  const [scrollTop, setScrollTop] = React.useState(0);

  // Per-row top offsets + total height (uniform, fixed metrics).
  const { offsets, total } = React.useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const r of rows) {
      offsets.push(acc);
      acc += r.type === 'header' ? HEADER_HEIGHT : CELL_ROW_HEIGHT;
    }
    return { offsets, total: acc };
  }, [rows]);
  const offsetsRef = React.useRef(offsets);
  offsetsRef.current = offsets;

  const viewportRef = React.useRef<HTMLElement | null>(null);
  const onScroll = React.useCallback(() => {
    setScrollTop(viewportRef.current?.scrollTop ?? 0);
  }, []);
  // The ScrollArea forwards this ref to its root; scrolling happens on the inner
  // viewport (and scroll events don't bubble), so listen on it directly.
  const setScrollRoot = React.useCallback(
    (el: HTMLElement | null) => {
      viewportRef.current?.removeEventListener('scroll', onScroll);
      viewportRef.current =
        el?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ??
        null;
      viewportRef.current?.addEventListener('scroll', onScroll, {
        passive: true,
      });
    },
    [onScroll],
  );

  // Let the sibling nav jump to a category by scrolling to its header offset.
  React.useEffect(() => {
    scrollerRef.current = {
      scrollToIndex: (index) => {
        const y = offsetsRef.current[index] ?? 0;
        const vp = viewportRef.current;
        if (vp) vp.scrollTop = y;
        setScrollTop(y);
      },
    };
    return () => {
      scrollerRef.current = null;
    };
  }, [scrollerRef]);

  // A new row set (e.g. entering/leaving search) starts back at the top.
  React.useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [results]);

  // Empty search -> the empty state, not a windowed list.
  if (results && results.length === 0) {
    return (
      <ScrollArea
        ref={setScrollRoot}
        className={cn(emojiPickerContentVariants({ size }), className)}
        {...props}
      >
        {children ?? <EmojiPickerEmpty />}
      </ScrollArea>
    );
  }

  // The visible window (+ overscan), found over the fixed offsets.
  const top = scrollTop - OVERSCAN_PX;
  const bottom = scrollTop + viewportHeight + OVERSCAN_PX;
  const rowHeight = (i: number) =>
    rows[i].type === 'header' ? HEADER_HEIGHT : CELL_ROW_HEIGHT;
  let start = 0;
  while (start < rows.length && offsets[start] + rowHeight(start) < top)
    start++;
  let end = start;
  while (end < rows.length && offsets[end] <= bottom) end++;

  // The header to pin: the last one whose offset is at or above the viewport top.
  let stickyIndex = -1;
  for (const hi of headerIndices) {
    if (offsets[hi] <= scrollTop) stickyIndex = hi;
    else break;
  }

  return (
    <ScrollArea
      ref={setScrollRoot}
      className={cn(emojiPickerContentVariants({ size }), className)}
      {...props}
    >
      <div style={{ position: 'relative', width: '100%', height: total }}>
        {stickyIndex >= 0 && rows[stickyIndex].type === 'header' && (
          <div
            style={{ position: 'sticky', top: 0, zIndex: 10, width: '100%' }}
          >
            <EmojiPickerGroupLabel>
              {(rows[stickyIndex] as { name: string }).name}
            </EmojiPickerGroupLabel>
          </div>
        )}
        {rows.slice(start, end).map((row, i) => {
          const index = start + i;
          // The pinned header is rendered once, above - skip its in-flow copy.
          if (index === stickyIndex) return null;
          return (
            <div
              key={row.key}
              data-index={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${offsets[index]}px)`,
              }}
            >
              {row.type === 'header' ? (
                <EmojiPickerGroupLabel>{row.name}</EmojiPickerGroupLabel>
              ) : (
                <EmojiGrid emojis={row.emojis} onSelect={select} />
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/** Category jump-nav. Hidden while searching. */
function EmojiPickerNav({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Tabs>, 'value' | 'onValueChange'>) {
  const { results, navCategories, active, scrollToCategory, hasFrequent } =
    useEmojiPicker();
  if (results) return null;
  return (
    <Tabs
      data-slot="emoji-picker-nav"
      value={active}
      onValueChange={(value) => scrollToCategory(String(value))}
      className={className}
      {...props}
    >
      <TabsList variant="line" className="w-full justify-between gap-0">
        {navCategories.map((c) => {
          const Icon = CATEGORY_ICONS[c.id] ?? Smile;
          const disabled = c.id === 'frequent' && !hasFrequent;
          return (
            <TabsTrigger
              key={c.id}
              value={c.id}
              disabled={disabled}
              aria-label={c.name}
              className="flex-1 px-0"
            >
              <Icon />
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function EmojiGrid({
  emojis,
  onSelect,
}: {
  emojis: EmojiDatum[];
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {emojis.map((em, i) => (
        <EmojiCell key={`${em.e}-${i}`} emoji={em} onSelect={onSelect} />
      ))}
    </div>
  );
}

/** One emoji button, drawn in the app-wide Fluent style (`setFluentEmojiStyle`).
 * Only cells in (or near) the viewport mount, so the Fluent artwork is rendered
 * immediately - virtualization, not per-cell deferral, is what keeps opening the
 * picker from fetching the whole catalog. */
function EmojiCell({
  emoji,
  onSelect,
}: {
  emoji: EmojiDatum;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Button
      type="button"
      onClick={() => onSelect(emoji.e)}
      title={emoji.n}
      aria-label={emoji.n}
      size="icon"
      variant="ghost"
    >
      <FluentEmoji
        glyph={emoji.e}
        name={emoji.n}
        className="size-full object-contain"
      />
    </Button>
  );
}

export {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerNav,
  EmojiPickerEmpty,
  EmojiPickerGroupLabel,
  emojiPickerContentVariants,
};
export type {
  EmojiPickerProps,
  EmojiPickerSearchProps,
  EmojiPickerContentProps,
  EmojiPickerEmptyProps,
};
