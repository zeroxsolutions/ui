'use client';

import { EMOJI_CATEGORIES, FluentEmoji, type EmojiDatum } from '@zeroxsolutions/fluent-emoji';
import { Dumbbell, Flag, Hash, Lightbulb, Plane, SearchX, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ClockIcon } from '@/registry/bases/base-ui/ui/clock';
import { CoffeeIcon } from '@/registry/bases/base-ui/ui/coffee';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { LeafIcon } from '@/registry/bases/base-ui/ui/leaf';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';
import { SearchIcon, type SearchIconHandle } from '@/registry/bases/base-ui/ui/search';
import { SmileIcon } from '@/registry/bases/base-ui/ui/smile';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** What every `@lucide-animated` icon's ref exposes. */
interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedIcon = React.ComponentType<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<AnimatedIconHandle>>;

/** The nav's glyph per category: animated where `@lucide-animated` draws it, a still lucide glyph where it does not. */
const CATEGORY_ICONS: Record<string, { animated: AnimatedIcon } | { still: LucideIcon }> = {
  frequent: { animated: ClockIcon },
  smileys_people: { animated: SmileIcon },
  animals_nature: { animated: LeafIcon },
  food_drink: { animated: CoffeeIcon },
  travel_places: { still: Plane },
  activities: { still: Dumbbell },
  objects: { still: Lightbulb },
  symbols: { still: Hash },
  flags: { still: Flag },
};

/** Cells per grid row. */
const COLUMNS = 8;
/**
 * The grid's metrics in spacing steps (multiples of the theme's `--spacing`).
 * They are the one source for both sides: `EmojiPickerContent` hands them to CSS
 * as variables the classes read, and the window arithmetic below turns them into
 * px, so the visible window needs no element measurement (which reads 0 in
 * jsdom) and no ResizeObserver. A cell is the preset's `size="icon"` button,
 * `size-8`; the recipe draws it, so a change there has to change `CELL_STEPS`.
 */
const CELL_STEPS = 8;
const ROW_GAP_STEPS = 0.5;
const HEADER_STEPS = 7;
const HEIGHT_STEPS = { sm: 40, md: 60, lg: 80 } as const;
/** The px one spacing step measures at the default `--spacing` (0.25rem) on a 16px root; the arithmetic assumes it. */
const SPACING_PX = 4;
const CELL_ROW_PX = (CELL_STEPS + ROW_GAP_STEPS) * SPACING_PX;
const HEADER_PX = HEADER_STEPS * SPACING_PX;
/** Rows rendered beyond the viewport on each side, in px (~6 rows). */
const OVERSCAN_PX = 6 * CELL_ROW_PX;

/** A length of `steps` spacing steps, as CSS that follows the theme's `--spacing`. */
function spacingSteps(steps: number): string {
  return `calc(var(--spacing) * ${steps})`;
}

interface EmojiSection {
  id: string;
  name: string;
  emojis: EmojiDatum[];
}

/** One virtual row: a sticky section heading or a row of up to `COLUMNS` emoji. */
type EmojiRow =
  { type: 'header'; key: string; id: string; name: string } | { type: 'cells'; key: string; emojis: EmojiDatum[] };

/** Flatten sections (or flat search results) into the virtualizer's row list. */
function buildRows(
  sections: EmojiSection[],
  results: EmojiDatum[] | null,
): { rows: EmojiRow[]; headerIndices: number[] } {
  const rows: EmojiRow[] = [];
  const headerIndices: number[] = [];
  const pushCells = (emojis: EmojiDatum[], keyBase: string) => {
    for (let i = 0; i < emojis.length; i += COLUMNS) {
      rows.push({
        type: 'cells',
        key: `${keyBase}-${i}`,
        emojis: emojis.slice(i, i + COLUMNS),
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

const EmojiPickerContext = React.createContext<EmojiPickerContextValue | null>(null);

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
 * default, never frozen) - an upstream `Empty` placed in `EmojiPickerContent`
 * overrides the no-results state.
 */
function EmojiPicker({
  onSelect,
  frequent = [],
  frequentLabel = 'Frequently used',
  children,
}: EmojiPickerProps): React.ReactNode {
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
    () => [{ id: 'frequent', name: frequentLabel }, ...EMOJI_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))],
    [frequentLabel],
  );

  const { rows, headerIndices } = React.useMemo(() => buildRows(sections, results), [sections, results]);

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
    [query, onSelect, results, navCategories, active, scrollToCategory, frequent.length, rows, headerIndices],
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

type EmojiPickerSearchProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> & {
  /** Override the default placeholder. */
  placeholder?: string;
  /** Override the default aria-label. */
  'aria-label'?: string;
};

/**
 * Search box bound to the picker query. Copy is overridable via the props;
 * `className` places the input group. Its search glyph plays while the box
 * takes focus.
 */
function EmojiPickerSearch({
  className,
  placeholder = 'Search',
  'aria-label': ariaLabel = 'Search emoji',
  onFocus,
  onBlur,
  ...props
}: EmojiPickerSearchProps): React.ReactNode {
  const { query, setQuery } = useEmojiPicker();
  const iconRef = React.useRef<SearchIconHandle>(null);
  return (
    <div data-slot="emoji-picker-search">
      <InputGroup className={className}>
        <InputGroupAddon>
          {/* The addon sizes only an svg that is its direct child, and this glyph wraps its svg in a div. */}
          <SearchIcon ref={iconRef} size={16} />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(event) => {
            onFocus?.(event);
            iconRef.current?.startAnimation();
          }}
          onBlur={(event) => {
            onBlur?.(event);
            iconRef.current?.stopAnimation();
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          {...props}
        />
      </InputGroup>
    </div>
  );
}

/** Sticky section heading - this is what "Frequently used" / a category name is. */
function EmojiPickerGroupLabel({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="emoji-picker-group-label"
      className={cn('bg-popover text-muted-foreground px-2 py-1 text-sm font-medium', className)}
      {...props}
    />
  );
}

// `style` is taken: the root carries the grid metrics as CSS variables there.
type EmojiPickerContentProps = Omit<React.ComponentProps<'div'>, 'style'> & {
  /** The viewport height: `sm`, `md` (default) or `lg`. */
  size?: keyof typeof HEIGHT_STEPS;
};

/**
 * Windowed, scrollable grid body: a region of the `size` height, placed by
 * `className`, holding a `ScrollArea` that fills it. While searching it shows the matches or -
 * when none - its `children` (an upstream `Empty` the consumer composes) or the
 * default empty state. Only the rows in (and near) the viewport mount; the
 * section header covering the top of the viewport is pinned.
 *
 * The window is plain arithmetic over fixed row heights and the known viewport
 * height (the `size` prop) - no element measurement, so it is correct under
 * jsdom (scroll starts at the top) and needs no virtualization library.
 */
function EmojiPickerContent({ className, children, size = 'md', ...props }: EmojiPickerContentProps): React.ReactNode {
  const { results, rows, headerIndices, scrollerRef } = useEmojiPicker();

  const viewportHeight = HEIGHT_STEPS[size] * SPACING_PX;
  const [scrollTop, setScrollTop] = React.useState(0);
  const metrics = {
    '--emoji-picker-height': spacingSteps(HEIGHT_STEPS[size]),
    '--emoji-picker-gap': spacingSteps(ROW_GAP_STEPS),
    '--emoji-picker-header': spacingSteps(HEADER_STEPS),
    '--emoji-picker-columns': `repeat(${COLUMNS}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  // Per-row top offsets + total height (uniform, fixed metrics).
  const { offsets, total } = React.useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const r of rows) {
      offsets.push(acc);
      acc += r.type === 'header' ? HEADER_PX : CELL_ROW_PX;
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
      viewportRef.current = el?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null;
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
      <div
        data-slot="emoji-picker-content"
        className={cn('h-(--emoji-picker-height)', className)}
        style={metrics}
        {...props}
      >
        <ScrollArea ref={setScrollRoot} className="h-full">
          {children ?? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No emoji found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </ScrollArea>
      </div>
    );
  }

  // The visible window (+ overscan), found over the fixed offsets.
  const top = scrollTop - OVERSCAN_PX;
  const bottom = scrollTop + viewportHeight + OVERSCAN_PX;
  const rowHeight = (i: number) => (rows[i].type === 'header' ? HEADER_PX : CELL_ROW_PX);
  let start = 0;
  while (start < rows.length && offsets[start] + rowHeight(start) < top) start++;
  let end = start;
  while (end < rows.length && offsets[end] <= bottom) end++;

  // The header to pin: the last one whose offset is at or above the viewport top.
  let stickyIndex = -1;
  for (const hi of headerIndices) {
    if (offsets[hi] <= scrollTop) stickyIndex = hi;
    else break;
  }

  return (
    <div
      data-slot="emoji-picker-content"
      className={cn('h-(--emoji-picker-height)', className)}
      style={metrics}
      {...props}
    >
      <ScrollArea ref={setScrollRoot} className="h-full">
        <div className="relative w-full" style={{ height: total }}>
          {stickyIndex >= 0 && rows[stickyIndex].type === 'header' && (
            <div className="sticky top-0 z-10 w-full">
              <EmojiPickerGroupLabel className="h-(--emoji-picker-header)">
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
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${offsets[index]}px)` }}
              >
                {row.type === 'header' ? (
                  <EmojiPickerGroupLabel className="h-(--emoji-picker-header)">{row.name}</EmojiPickerGroupLabel>
                ) : (
                  <EmojiPickerGrid>
                    {row.emojis.map((emoji, i) => (
                      <EmojiPickerCell key={`${emoji.e}-${i}`} emoji={emoji} />
                    ))}
                  </EmojiPickerGrid>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/** Category jump-nav. Hidden while searching. */
function EmojiPickerNav({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Tabs>, 'value' | 'onValueChange'>): React.ReactNode {
  const { results, navCategories, active, scrollToCategory, hasFrequent } = useEmojiPicker();
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
        {navCategories.map((c) => (
          <EmojiPickerNavTrigger
            key={c.id}
            value={c.id}
            disabled={c.id === 'frequent' && !hasFrequent}
            aria-label={c.name}
          />
        ))}
      </TabsList>
    </Tabs>
  );
}

/** One category tab, its glyph from `CATEGORY_ICONS`; an animated glyph plays on the tab's hover or focus. */
function EmojiPickerNavTrigger({
  value,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof TabsTrigger> & { value: string }): React.ReactNode {
  const iconRef = React.useRef<AnimatedIconHandle>(null);
  const icon = CATEGORY_ICONS[value] ?? CATEGORY_ICONS.smileys_people;
  return (
    <TabsTrigger
      value={value}
      className="flex-1"
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      {'animated' in icon ? <icon.animated ref={iconRef} /> : <icon.still />}
    </TabsTrigger>
  );
}

/** One row of cells, laid out in the columns and gap `EmojiPickerContent` sets. */
function EmojiPickerGrid({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="emoji-picker-grid"
      className={cn('grid grid-cols-(--emoji-picker-columns) gap-(--emoji-picker-gap)', className)}
      {...props}
    />
  );
}

type EmojiPickerCellProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  /** The emoji this cell draws and hands to the picker's `onSelect` when pressed. */
  emoji: EmojiDatum;
};

/** One emoji button, drawn in the app-wide Fluent style (`setFluentEmojiStyle`).
 * Only cells in (or near) the viewport mount, so the Fluent artwork is rendered
 * immediately - virtualization, not per-cell deferral, is what keeps opening the
 * picker from fetching the whole catalog. */
function EmojiPickerCell({ emoji, className, onClick, ...props }: EmojiPickerCellProps): React.ReactNode {
  const { select } = useEmojiPicker();
  return (
    <Button
      data-slot="emoji-picker-cell"
      type="button"
      title={emoji.n}
      aria-label={emoji.n}
      size="icon"
      variant="ghost"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        select(emoji.e);
      }}
      {...props}
    >
      <FluentEmoji glyph={emoji.e} name={emoji.n} className="size-6 object-contain" />
    </Button>
  );
}

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerNav, EmojiPickerGroupLabel };
export type { EmojiPickerProps, EmojiPickerSearchProps, EmojiPickerContentProps };
