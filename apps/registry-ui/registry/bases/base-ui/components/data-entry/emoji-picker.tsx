'use client';

import { EMOJI_CATEGORIES, FluentEmoji, type EmojiDatum } from '@zeroxsolutions/fluent-emoji';
import { Dumbbell, Flag, Hash, Lightbulb, Plane, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ClockIcon, type ClockIconHandle } from '@/registry/bases/base-ui/icons/clock-icon';
import { CoffeeIcon } from '@/registry/bases/base-ui/icons/coffee-icon';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { LeafIcon } from '@/registry/bases/base-ui/icons/leaf-icon';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';
import { SearchIcon, type SearchIconHandle } from '@/registry/bases/base-ui/icons/search-icon';
import { SmileIcon } from '@/registry/bases/base-ui/icons/smile-icon';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The nav's glyph per category: animated where the registry's animated icons draw it, a still lucide glyph where they do not.
 * Every animated icon shares `ClockIcon`'s props and ref handle.
 */
const CATEGORY_ICONS: Record<string, { animated: typeof ClockIcon } | { still: LucideIcon }> = {
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
 * as variables the classes read, and the window arithmetic turns them into px
 * at the measured `--spacing`, so the visible window needs no per-row
 * measurement and no ResizeObserver. A cell is the preset's `size="icon"`
 * button, `size-8`; the recipe draws it, so a change there has to change
 * `CELL_STEPS`.
 */
const CELL_STEPS = 8;
const ROW_GAP_STEPS = 0.5;
const HEADER_STEPS = 7;
const HEIGHT_STEPS = { sm: 40, md: 60, lg: 80 } as const;
/** Rows rendered beyond the viewport on each side, in cell rows. */
const OVERSCAN_ROWS = 6;
/** The px of one spacing step at the default `--spacing` (0.25rem) on a 16px root; used until the theme is read, and under jsdom, which resolves no custom property. */
const DEFAULT_STEP_PX = 4;

/** A length of `steps` spacing steps, as CSS that follows the theme's `--spacing`. */
function emojiPickerSpacing(steps: number): string {
  return `calc(var(--spacing) * ${steps})`;
}

/** The px one `--spacing` step measures on `element`, or `DEFAULT_STEP_PX` when the theme gives no rem or px length. */
function emojiPickerStepPx(element: HTMLElement): number {
  const spacing = getComputedStyle(element).getPropertyValue('--spacing').trim();
  const length = Number.parseFloat(spacing);
  if (!Number.isFinite(length) || length <= 0) return DEFAULT_STEP_PX;
  if (spacing.endsWith('rem')) {
    return length * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  if (spacing.endsWith('px')) return length;
  return DEFAULT_STEP_PX;
}

interface EmojiPickerSection {
  id: string;
  name: string;
  emojis: EmojiDatum[];
}

/** One virtual row: a sticky section heading or a row of up to `COLUMNS` emoji. */
type EmojiPickerRow =
  { type: 'header'; key: string; id: string; name: string } | { type: 'cells'; key: string; emojis: EmojiDatum[] };

/** Sections (or flat search results) flattened into the window's row list, with the indices that are headings. */
function emojiPickerRows(
  sections: EmojiPickerSection[],
  results: EmojiDatum[] | null,
): { rows: EmojiPickerRow[]; headerIndices: number[] } {
  const rows: EmojiPickerRow[] = [];
  const headerIndices: number[] = [];
  const pushCells = (emojis: EmojiDatum[], keyBase: string): void => {
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
  setQuery: (q: string) => void;
  /** Forwards the chosen emoji to the consumer's onSelect. */
  select: (emoji: string) => void;
  /** Search results, or null when not searching. */
  results: EmojiDatum[] | null;
  navCategories: { id: string; name: string; disabled: boolean }[];
  active: string;
  scrollToCategory: (id: string) => void;
  /** Flattened rows + the indices that are sticky headers. */
  rows: EmojiPickerRow[];
  headerIndices: number[];
  /** The scrollable grid registers its window here so the nav can jump. */
  scrollerRef: React.RefObject<EmojiPickerScroller | null>;
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
   * The frequent row, shown first and given its own nav item. The consumer owns
   * the list and its persistence - the picker keeps no storage of its own.
   * Omitted, the picker has no frequent section and no nav item for one.
   */
  frequent?: EmojiPickerFrequent;
  /** The parts: `EmojiPickerSearch`, `EmojiPickerContent` (holding `EmojiPickerEmpty`) and `EmojiPickerNav`. */
  children: React.ReactNode;
}

/**
 * A searchable, categorized emoji grid with an optional frequent row and a
 * category nav - modelled on the LobeHub picker. The catalog and the Fluent 3D
 * artwork come from `@zeroxsolutions/fluent-emoji` (self-hosted, no third-party CDN).
 *
 * The grid is **windowed**: only the rows in (and near) the viewport mount, so
 * opening the ~1900-emoji catalog renders one screenful and fetches only the
 * artwork in view.
 *
 * The root owns the query, the active category and the rows, and renders
 * nothing of its own; the consumer composes the parts:
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
function EmojiPicker({ onSelect, frequent, children }: EmojiPickerProps): React.ReactNode {
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

  const sections = React.useMemo<EmojiPickerSection[]>(() => {
    const head: EmojiPickerSection[] =
      frequent && frequent.emojis.length > 0
        ? [
            {
              id: 'frequent',
              name: frequent.name,
              emojis: frequent.emojis.map((e) => ({ e, n: e, k: '' })),
            },
          ]
        : [];
    return [...head, ...EMOJI_CATEGORIES];
  }, [frequent]);

  const navCategories = React.useMemo(
    () => [
      ...(frequent ? [{ id: 'frequent', name: frequent.name, disabled: frequent.emojis.length === 0 }] : []),
      ...EMOJI_CATEGORIES.map((c) => ({ id: c.id, name: c.name, disabled: false })),
    ],
    [frequent],
  );

  const { rows, headerIndices } = React.useMemo(() => emojiPickerRows(sections, results), [sections, results]);

  // The scrollable grid (in EmojiPickerContent) registers its window here;
  // the nav lives in a sibling subtree and jumps through this ref.
  const scrollerRef = React.useRef<EmojiPickerScroller | null>(null);

  const scrollToCategory = React.useCallback(
    (id: string) => {
      setActive(id);
      const idx = rows.findIndex((r) => r.type === 'header' && r.id === id);
      if (idx >= 0) scrollerRef.current?.scrollToIndex(idx);
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
      rows,
      headerIndices,
      scrollerRef,
    }),
    [query, onSelect, results, navCategories, active, scrollToCategory, rows, headerIndices],
  );

  return <EmojiPickerContext.Provider value={ctx}>{children}</EmojiPickerContext.Provider>;
}

type EmojiPickerSearchProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>;

/**
 * Search box bound to the picker query, over upstream's `InputGroup`.
 * `placeholder` defaults to `Search` and `aria-label` to `Search emoji`;
 * `className` places the group. Its search glyph plays on the group's hover and
 * while the box takes focus.
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
    <InputGroup
      data-slot="emoji-picker-search"
      className={className}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
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
  );
}

/**
 * Sticky section heading - this is what the frequent row's name / a category name is.
 * Drawn as the preset's own group labels (`ComboboxLabel`, `SelectLabel`), on
 * the surface the picker sits on so rows scrolling under it stay hidden: the
 * popover's colour inside a `PopoverContent`, the card's inside a `Card`, the
 * page background elsewhere, and `--emoji-picker-surface` wherever a container
 * sets it, for any other surface or a popover whose content renames its
 * `data-slot` (the avatar picker sets its popover's colour this way).
 */
function EmojiPickerGroupLabel({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="emoji-picker-group-label"
      className={cn(
        'text-muted-foreground bg-[var(--emoji-picker-surface,var(--background))] px-2 py-1.5 text-xs',
        '[[data-slot=card]_&]:bg-[var(--emoji-picker-surface,var(--card))]',
        '[[data-slot=popover-content]_&]:bg-[var(--emoji-picker-surface,var(--popover))]',
        className,
      )}
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
 * `className`, holding a `ScrollArea` that fills it. It draws the rows itself;
 * `children` sit in the same viewport after them, which is where an
 * `EmojiPickerEmpty` goes. Only the rows in (and near) the viewport mount; the
 * section header covering the top of the viewport is pinned.
 *
 * The window is arithmetic over fixed row heights and the known viewport
 * height (the `size` prop), both in spacing steps turned into px at the
 * theme's measured `--spacing`.
 */
function EmojiPickerContent({ className, children, size = 'md', ...props }: EmojiPickerContentProps): React.ReactNode {
  const { results, rows, headerIndices, scrollerRef } = useEmojiPicker();

  const rootRef = React.useRef<HTMLDivElement>(null);
  const [stepPx, setStepPx] = React.useState(DEFAULT_STEP_PX);
  React.useLayoutEffect(() => {
    if (rootRef.current) setStepPx(emojiPickerStepPx(rootRef.current));
  }, []);

  const cellRowPx = (CELL_STEPS + ROW_GAP_STEPS) * stepPx;
  const headerPx = HEADER_STEPS * stepPx;
  const overscanPx = OVERSCAN_ROWS * cellRowPx;
  const viewportHeight = HEIGHT_STEPS[size] * stepPx;
  const [scrollTop, setScrollTop] = React.useState(0);
  const metrics = {
    '--emoji-picker-height': emojiPickerSpacing(HEIGHT_STEPS[size]),
    '--emoji-picker-gap': emojiPickerSpacing(ROW_GAP_STEPS),
    '--emoji-picker-header': emojiPickerSpacing(HEADER_STEPS),
    '--emoji-picker-columns': `repeat(${COLUMNS}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  // Per-row top offsets + total height (uniform, fixed metrics).
  const { offsets, total } = React.useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const r of rows) {
      offsets.push(acc);
      acc += r.type === 'header' ? headerPx : cellRowPx;
    }
    return { offsets, total: acc };
  }, [rows, headerPx, cellRowPx]);
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
      scrollToIndex: (index): void => {
        const y = offsetsRef.current[index] ?? 0;
        const vp = viewportRef.current;
        if (vp) vp.scrollTop = y;
        setScrollTop(y);
      },
    };
    return (): void => {
      scrollerRef.current = null;
    };
  }, [scrollerRef]);

  // A new row set (e.g. entering/leaving search) starts back at the top.
  React.useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [results]);

  // The visible window (+ overscan), found over the fixed offsets.
  const top = scrollTop - overscanPx;
  const bottom = scrollTop + viewportHeight + overscanPx;
  const rowHeight = (i: number): number => (rows[i].type === 'header' ? headerPx : cellRowPx);
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
  const sticky = stickyIndex >= 0 ? rows[stickyIndex] : undefined;

  return (
    <div
      ref={rootRef}
      data-slot="emoji-picker-content"
      className={cn('h-(--emoji-picker-height)', className)}
      style={metrics}
      {...props}
    >
      <ScrollArea ref={setScrollRoot} className="h-full">
        {/* Inset past the ScrollArea's scrollbar (w-2.5) on both sides: the bar sits over the viewport's edge and would cover the last column. */}
        <div className="relative w-full" style={{ height: total }}>
          {sticky?.type === 'header' && (
            <div className="sticky top-0 z-10 w-full px-3">
              <EmojiPickerGroupLabel className="h-(--emoji-picker-header)">{sticky.name}</EmojiPickerGroupLabel>
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
                className="absolute inset-x-3 top-0"
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
        {children}
      </ScrollArea>
    </div>
  );
}

/**
 * The no-results state: renders, with its `children` (an upstream `Empty` the
 * consumer composes), only while a search matches nothing, as upstream's
 * `ComboboxEmpty` does. Place it in `EmojiPickerContent`.
 */
function EmojiPickerEmpty(props: React.ComponentProps<'div'>): React.ReactNode {
  const { results } = useEmojiPicker();
  if (!results || results.length > 0) return null;
  return <div data-slot="emoji-picker-empty" {...props} />;
}

/**
 * Category jump-nav, over upstream's `ToggleGroup` joined (`spacing={0}`):
 * one item per category, the active one always pressed, the items sharing the
 * picker's full width. Each item's accessible name is its category's name; give
 * the group its own `aria-label`. Hidden while searching.
 */
function EmojiPickerNav({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof ToggleGroup>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
>): React.ReactNode {
  const { results, navCategories, active, scrollToCategory } = useEmojiPicker();
  if (results) return null;
  return (
    <ToggleGroup
      data-slot="emoji-picker-nav"
      spacing={0}
      className={cn('w-full', className)}
      value={[active]}
      onValueChange={(next: string[]) => {
        // Pressing the active item reports an empty value; the nav never deselects.
        const picked = next.find((v) => v !== active);
        if (picked) scrollToCategory(picked);
      }}
      {...props}
    >
      {navCategories.map((c) => (
        <EmojiPickerNavItem key={c.id} value={c.id} disabled={c.disabled} aria-label={c.name} />
      ))}
    </ToggleGroup>
  );
}

/** One category item, its glyph from `CATEGORY_ICONS`; an animated glyph plays on the item's hover or focus. */
function EmojiPickerNavItem({
  value,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof ToggleGroupItem> & { value: string }): React.ReactNode {
  const iconRef = React.useRef<ClockIconHandle>(null);
  const icon = CATEGORY_ICONS[value] ?? CATEGORY_ICONS.smileys_people;
  return (
    <ToggleGroupItem
      data-slot="emoji-picker-nav-item"
      value={value}
      className={cn('flex-1', className)}
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
    </ToggleGroupItem>
  );
}

/** One row of cells, laid out in the columns and gap `EmojiPickerContent` sets. */
function EmojiPickerGrid({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="emoji-picker-grid"
      className={cn('grid grid-cols-(--emoji-picker-columns) justify-items-center gap-(--emoji-picker-gap)', className)}
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

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerEmpty, EmojiPickerNav, EmojiPickerGroupLabel };
export type { EmojiPickerProps, EmojiPickerFrequent, EmojiPickerSearchProps, EmojiPickerContentProps };
