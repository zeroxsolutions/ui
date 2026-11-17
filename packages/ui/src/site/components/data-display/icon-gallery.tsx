'use client';

import { useDeferredValue, useId, useState, type ReactNode } from 'react';

import { filterIconSets, type IconSet } from '../../lib/icon-sets';
import { installLine } from '../../lib/install-line';
import { Input } from '../../../../registry/bases/base-ui/ui/input';
import {
  SourceCodeCard,
  SourceCodeCardActions,
  SourceCodeCardCode,
  SourceCodeCardContent,
  SourceCodeCardCopy,
  SourceCodeCardHeader,
  SourceCodeCardLanguage,
  SourceCodeCardTitle,
} from './source-code-card';

interface IconGalleryGridProps {
  /** What the reader typed in the search box. */
  query: string;
  /** Picks the icon with this item name, which the install panel then shows. */
  onPick: (name: string) => void;
}

interface IconGalleryProps {
  sets: IconSet[];
  /** Draws the icons whose name holds `query`, each of which calls `onPick` with its item name when picked. */
  renderGrid: (props: IconGalleryGridProps) => ReactNode;
  /** Called with the item name of each icon the reader picks. */
  onPick?: (name: string) => void;
}

/** `glyph`'s export name, as the icon's file declares it: `arrow-up` gives `ArrowUpIcon`. */
function iconGalleryExportName(glyph: string): string {
  return `${glyph
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}Icon`;
}

/** How an app imports and holds the icon `glyph` of `set`, at the path the CLI writes it to on either platform. */
function iconGalleryUsage(set: string, glyph: string): string {
  const name = iconGalleryExportName(glyph);
  return [
    `import { ${name}, type ${name}Handle } from '@/components/general/${set}/${glyph}-icon';`,
    '',
    `const icon = useRef<${name}Handle>(null);`,
    '',
    '// The control holding the icon plays it: icon.current?.startAnimation() as the',
    '// control is pointed at or focused, icon.current?.stopAnimation() as it is left.',
    `<${name} ref={icon} size={16} />`,
  ].join('\n');
}

/** A code block of the install panel, with its own copy button. */
function IconGalleryCode({ code, language, copyLabel }: { code: string; language: string; copyLabel: string }) {
  return (
    <SourceCodeCard code={code} language={language}>
      <SourceCodeCardHeader>
        <SourceCodeCardTitle>
          <SourceCodeCardLanguage>{language}</SourceCodeCardLanguage>
        </SourceCodeCardTitle>
        <SourceCodeCardActions>
          <SourceCodeCardCopy label={copyLabel} />
        </SourceCodeCardActions>
      </SourceCodeCardHeader>
      <SourceCodeCardContent>
        <SourceCodeCardCode />
      </SourceCodeCardContent>
    </SourceCodeCard>
  );
}

/** The install line and the usage of the picked icon, under its glyph's name. */
function IconGalleryInstall({ name, set, glyph }: { name: string; set: string; glyph: string }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-slot="icon-gallery-install" className="flex flex-col gap-4">
      <h2 id={headingId} className="font-mono text-lg font-semibold">
        {glyph}
      </h2>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Install</h3>
        <IconGalleryCode code={installLine(name)} language="bash" copyLabel="Copy the install line" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Usage</h3>
        <IconGalleryCode code={iconGalleryUsage(set, glyph)} language="tsx" copyLabel="Copy the usage" />
      </div>
    </section>
  );
}

/** How many icons the search leaves, or that it leaves none. */
function iconGalleryStatus(count: number, query: string): string {
  if (count === 0) return `No icon has a name holding "${query.trim()}".`;
  return count === 1 ? '1 icon' : `${count} icons`;
}

/**
 * The icons of `sets`: a search box narrowing them by name, the grid `renderGrid` draws for what the
 * reader typed, and, for the icon the reader picks there, its install line and usage. The grid is drawn
 * for the typed text a beat behind the box, so typing stays quick while a long grid redraws.
 */
function IconGallery({ sets, renderGrid, onPick }: IconGalleryProps): ReactNode {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const shownQuery = useDeferredValue(query);
  const [picked, setPicked] = useState<string>();
  const count = filterIconSets(sets, shownQuery).reduce((total, { icons }) => total + icons.length, 0);
  const pickedIcon = sets
    .flatMap(({ set, icons }) => icons.map((icon) => ({ set, ...icon })))
    .find((icon) => icon.name === picked);

  const pick = (name: string): void => {
    setPicked(name);
    onPick?.(name);
  };

  return (
    <div data-slot="icon-gallery" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={searchId} className="sr-only">
          Search icons
        </label>
        <Input
          id={searchId}
          type="search"
          placeholder="Search icons"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p role="status" className="text-muted-foreground text-sm">
          {iconGalleryStatus(count, shownQuery)}
        </p>
      </div>
      <div className="flex flex-col-reverse gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">{renderGrid({ query: shownQuery, onPick: pick })}</div>
        <div className="lg:sticky lg:top-20 lg:w-96">
          {pickedIcon ? (
            <IconGalleryInstall name={pickedIcon.name} set={pickedIcon.set} glyph={pickedIcon.glyph} />
          ) : (
            <p className="text-muted-foreground text-sm">Pick an icon to see its install line and its usage.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { IconGallery };
