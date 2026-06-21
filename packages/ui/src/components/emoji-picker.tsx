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
  Smile,
  type LucideIcon,
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputSearch } from './input-search';
import { cn } from '@/lib/utils';
import {
  EMOJI_CATEGORIES,
  type EmojiDatum,
} from '@/lib/emoji/emoji-data';

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

const FREQUENT_KEY = 'chisel-ui:emoji-frequent';
const FREQUENT_MAX = 24;

function readFrequent(): string[] {
  try {
    const raw = localStorage.getItem(FREQUENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeFrequent(list: string[]): void {
  try {
    localStorage.setItem(FREQUENT_KEY, JSON.stringify(list.slice(0, FREQUENT_MAX)));
  } catch {
    // storage unavailable (private mode / SSR) — frequency is best-effort.
  }
}

export interface EmojiPickerProps {
  /** Called with the chosen emoji glyph. */
  onSelect: (emoji: string) => void;
  className?: string;
}

/**
 * Chisel's own emoji picker (no third-party widget): a searchable, categorized
 * grid with a "Frequently used" row and a bottom category nav — modelled on the
 * LobeHub picker. Data is the committed `emoji-data.ts` (generated from Unicode
 * CLDR); frequency is tracked in localStorage.
 */
export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [query, setQuery] = React.useState('');
  const [frequent, setFrequent] = React.useState<string[]>(() => readFrequent());
  const [active, setActive] = React.useState('smileys_people');
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setFrequent((prev) => {
      const next = [emoji, ...prev.filter((x) => x !== emoji)].slice(0, FREQUENT_MAX);
      writeFrequent(next);
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (!q) return null;
    const out: EmojiDatum[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const em of cat.emojis) if (em.k.includes(q)) out.push(em);
    }
    return out;
  }, [q]);

  const sections = React.useMemo(() => {
    const head =
      frequent.length > 0
        ? [
            {
              id: 'frequent',
              name: 'Frequently used',
              emojis: frequent.map((e) => ({ e, n: e, k: '' })),
            },
          ]
        : [];
    return [...head, ...EMOJI_CATEGORIES];
  }, [frequent]);

  const navCategories = [
    { id: 'frequent', name: 'Frequently used' },
    ...EMOJI_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
  ];

  const scrollToCategory = (id: string) => {
    setActive(id);
    sectionRefs.current[id]?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="px-2 pb-2">
        <InputSearch
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search emoji"
        />
      </div>

      <ScrollArea className="h-60">
        <div className="px-2">
          {results ? (
            results.length > 0 ? (
              <EmojiGrid emojis={results} onSelect={handleSelect} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No emoji found</p>
            )
          ) : (
            sections.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => {
                  sectionRefs.current[cat.id] = el;
                }}
              >
                <div className="sticky top-0 z-10 bg-popover px-1 py-1.5 text-xs font-medium text-muted-foreground">
                  {cat.name}
                </div>
                <EmojiGrid emojis={cat.emojis} onSelect={handleSelect} />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {!results && (
        <Tabs
          value={active}
          onValueChange={(value) => scrollToCategory(String(value))}
          className="px-2 pt-1"
        >
          <TabsList variant="line" className="w-full justify-between gap-0">
            {navCategories.map((c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? Smile;
              const disabled = c.id === 'frequent' && frequent.length === 0;
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
      )}
    </div>
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
        <button
          key={`${em.e}-${i}`}
          type="button"
          onClick={() => onSelect(em.e)}
          title={em.n}
          aria-label={em.n}
          className="flex aspect-square items-center justify-center rounded-md text-xl leading-none transition-colors hover:bg-accent"
        >
          {em.e}
        </button>
      ))}
    </div>
  );
}
