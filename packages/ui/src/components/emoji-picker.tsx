import * as React from 'react';
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

import { getFluentEmojiCDN } from '@lobehub/fluent-emoji';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from './search-input';
import { cn } from '@/lib/utils';
import { EMOJI_CATEGORIES, type EmojiDatum } from '@/lib/emoji/emoji-data';
import { cva, type VariantProps } from 'class-variance-authority';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';
import { Button } from './ui/button';

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

/** Default heading for the frequent row; override via composition. */
const FREQUENT_LABEL = 'Frequently used';

interface EmojiSection {
  id: string;
  name: string;
  emojis: EmojiDatum[];
}

interface EmojiPickerContextValue {
  query: string;
  setQuery: (q: string) => void;
  /** Forwards the chosen emoji to the consumer's onSelect. */
  select: (emoji: string) => void;
  /** Search results, or null when not searching. */
  results: EmojiDatum[] | null;
  sections: EmojiSection[];
  navCategories: { id: string; name: string }[];
  active: string;
  scrollToCategory: (id: string) => void;
  sectionRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  hasFrequent: boolean;
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

export interface EmojiPickerProps {
  /** Called with the chosen emoji glyph. */
  onSelect: (emoji: string) => void;
  /**
   * Recently-used emoji glyphs shown in the frequent row. The consumer owns this
   * list and its persistence — the picker keeps no storage of its own.
   */
  frequent?: string[];
  /**
   * Compose the parts (`EmojiPickerSearch`, `EmojiPickerContent`,
   * `EmojiPickerNav`) to override copy or layout. Omit for the default picker.
   */
  children?: React.ReactNode;
}

/**
 * A searchable, categorized emoji grid with an optional frequent row and a
 * category nav — modelled on the LobeHub picker. Data is the committed
 * `emoji-data.ts` (generated from Unicode CLDR); the frequent row is
 * consumer-supplied (`frequent`) — the picker holds no persistence of its own.
 *
 * Compound + context: the Root owns the state and the parts read it. Used bare
 * (`<EmojiPicker onSelect />`) it renders the default composition; compose the
 * parts to override any visible copy (every string is a part's `children`/prop
 * default, never frozen) — `<EmojiPickerEmpty>` overrides the no-results state.
 */
export function EmojiPicker({
  onSelect,
  frequent = [],
  children,
}: EmojiPickerProps) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState('smileys_people');
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

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
              name: FREQUENT_LABEL,
              emojis: frequent.map((e) => ({ e, n: e, k: '' })),
            },
          ]
        : [];
    return [...head, ...EMOJI_CATEGORIES];
  }, [frequent]);

  const navCategories = React.useMemo(
    () => [
      { id: 'frequent', name: FREQUENT_LABEL },
      ...EMOJI_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
    ],
    [],
  );

  const scrollToCategory = React.useCallback((id: string) => {
    setActive(id);
    sectionRefs.current[id]?.scrollIntoView({ block: 'start' });
  }, []);

  const ctx = React.useMemo<EmojiPickerContextValue>(
    () => ({
      query,
      setQuery,
      select: onSelect,
      results,
      sections,
      navCategories,
      active,
      scrollToCategory,
      sectionRefs,
      hasFrequent: frequent.length > 0,
    }),
    [
      query,
      onSelect,
      results,
      sections,
      navCategories,
      active,
      scrollToCategory,
      frequent.length,
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

export type EmojiPickerSearchProps = Omit<
  React.ComponentProps<typeof SearchInput>,
  'value' | 'onChange'
> & {
  /** Override the default placeholder. */
  placeholder?: string;
  /** Override the default aria-label. */
  'aria-label'?: string;
};

/** Search box bound to the picker query. Copy is overridable via the props. */
export function EmojiPickerSearch({
  className,
  placeholder = 'Search',
  'aria-label': ariaLabel = 'Search emoji',
  ...props
}: EmojiPickerSearchProps) {
  const { query, setQuery } = useEmojiPicker();
  return (
    <div className="px-2 py-1">
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

/** Sticky section heading — this is what "Frequently used" / a category name is. */
export function EmojiPickerGroupLabel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 bg-popover px-2 py-1 text-muted-foreground text-sm font-medium',
        className,
      )}
      {...props}
    />
  );
}

export type EmojiPickerEmptyProps = {
  /** Override the default no-results state. */
  children?: React.ReactNode;
};

/** No-results state. `children` overrides the default copy; place it in Content. */
export function EmojiPickerEmpty({ children }: EmojiPickerEmptyProps) {
  return children ? (
    children
  ) : (
    <Empty>
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

export type EmojiPickerContentProps = React.ComponentProps<typeof ScrollArea> &
  VariantProps<typeof emojiPickerContentVariants>;

/**
 * Scrollable grid body. While searching it shows the matches or — when none —
 * its `children` (an `EmojiPickerEmpty` override) or the default empty state.
 */
export function EmojiPickerContent({
  className,
  children,
  size = 'md',
  ...props
}: EmojiPickerContentProps) {
  const { results, sections, select, sectionRefs } = useEmojiPicker();
  return (
    <ScrollArea
      className={cn(emojiPickerContentVariants({ size }), className)}
      {...props}
    >
      {results ? (
        results.length > 0 ? (
          <EmojiGrid emojis={results} onSelect={select} />
        ) : (
          (children ?? <EmojiPickerEmpty />)
        )
      ) : (
        sections.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => {
              sectionRefs.current[cat.id] = el;
            }}
          >
            <EmojiPickerGroupLabel>{cat.name}</EmojiPickerGroupLabel>
            <EmojiGrid emojis={cat.emojis} onSelect={select} />
          </div>
        ))
      )}
    </ScrollArea>
  );
}

/** Category jump-nav. Hidden while searching. */
export function EmojiPickerNav({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Tabs>, 'value' | 'onValueChange'>) {
  const { results, navCategories, active, scrollToCategory, hasFrequent } =
    useEmojiPicker();
  if (results) return null;
  return (
    <Tabs
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

/**
 * A single Fluent 3D emoji, resolved by codepoint through LobeHub's
 * `getFluentEmojiCDN`. On a CDN/codepoint miss it falls back to the native
 * glyph so nothing renders blank. Temporary: the artwork is hot-linked from the
 * Fluent CDN; a self-hosted webp set will replace this later.
 */
function FluentEmojiImage({ glyph, name }: { glyph: string; name: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return <span className="text-xl leading-none">{glyph}</span>;
  }
  return (
    <img
      src={getFluentEmojiCDN(glyph, { type: '3d', cdn: 'unpkg' })}
      alt={name}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="size-full object-contain"
      onError={() => setFailed(true)}
    />
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
    <div className="grid grid-cols-8 gap-0.5 pb-2">
      {emojis.map((em, i) => (
        <Button
          key={`${em.e}-${i}`}
          type="button"
          onClick={() => onSelect(em.e)}
          title={em.n}
          aria-label={em.n}
          size='icon'
          variant='ghost'
        >
          <FluentEmojiImage glyph={em.e} name={em.n} />
        </Button>
      ))}
    </div>
  );
}
