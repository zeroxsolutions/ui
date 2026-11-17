'use client';

import { useInView } from 'motion/react';
import { Suspense, useRef, type ComponentType, type ReactNode, type Ref } from 'react';

import { type AnimatedIconHandle, useIconAnimation } from '../../hooks/use-icon-animation';
import { filterIconSets, type IconSet } from '../../lib/icon-sets';
import { useRegistryExample } from './registry-example';

/** One of the registry's animated icons, as a tile draws it. */
type AnimatedIcon = ComponentType<{ ref?: Ref<AnimatedIconHandle>; size?: number; 'aria-hidden'?: boolean }>;

interface IconGridProps {
  sets: IconSet[];
  /** What the reader typed; the grid shows the icons whose glyph holds it. */
  query: string;
  /** Called with the item name of the icon the reader picks. */
  onPick: (name: string) => void;
}

/**
 * A tile drawing one icon over its glyph's name, which picks the icon. The tile is the control that plays
 * the icon, on pointer enter and on focus. The icon is the one the registry examples provider holds under
 * its item name, a chunk of its own, which the tile draws once it first comes near the viewport: a grid
 * drawing every icon at once fetches every chunk and mounts every icon's motion before the reader has
 * scrolled, while the reader sees a screenful of them.
 */
function IconGridTile({ name, glyph, onPick }: { name: string; glyph: string; onPick: (name: string) => void }) {
  // The provider's map types every entry as a component taking no props; an icon item takes its handle's ref.
  const Icon = useRegistryExample(name) as AnimatedIcon | undefined;
  const { ref, handlers } = useIconAnimation<AnimatedIconHandle>();
  const tile = useRef<HTMLButtonElement>(null);
  const near = useInView(tile, { once: true, margin: '200px 0px' });
  const placeholder = <span className="size-6" />;

  return (
    <button
      ref={tile}
      type="button"
      data-slot="icon-grid-tile"
      className="hover:bg-muted focus-visible:ring-ring/50 flex w-full flex-col items-center gap-2 rounded-lg border px-2 py-4 outline-none focus-visible:ring-3"
      onClick={() => onPick(name)}
      {...handlers}
    >
      {Icon && near ? (
        <Suspense fallback={placeholder}>
          <Icon ref={ref} size={24} aria-hidden />
        </Suspense>
      ) : (
        placeholder
      )}
      <span className="text-muted-foreground w-full font-mono text-xs break-all">{glyph}</span>
    </button>
  );
}

/** The web icons of `sets` whose glyph holds `query`, a grid of tiles per set under the set's name. */
function IconGrid({ sets, query, onPick }: IconGridProps): ReactNode {
  return (
    <div data-slot="icon-grid" className="flex flex-col gap-8">
      {filterIconSets(sets, query).map(({ set, icons }) => (
        <section key={set} className="flex flex-col gap-3">
          <h2 className="font-mono text-sm font-medium">{set}</h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {icons.map(({ name, glyph }) => (
              <li key={name}>
                <IconGridTile name={name} glyph={glyph} onPick={onPick} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export { IconGrid };
