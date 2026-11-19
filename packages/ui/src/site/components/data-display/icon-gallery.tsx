'use client';

import { type FormEvent, type ReactNode, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useHost } from '../../../host/host-provider';
import { useHydrated } from '../../hooks/use-hydrated';
import { iconSearch, type IconSearch } from '../../lib/icon-search';
import { filterIconSets, iconExportName, type IconSet } from '../../lib/icon-sets';
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
  /** The item name of the icon the reader picked, which its tile marks as current; `undefined` before a pick. */
  picked?: string;
  /** Picks the icon with this item name, which the install panel then shows. */
  onPick: (name: string) => void;
}

interface IconGalleryProps {
  sets: IconSet[];
  /** Draws the icons whose name holds `query`, each of which calls `onPick` with its item name when picked. */
  renderGrid: (props: IconGalleryGridProps) => ReactNode;
  /** Called with the item name of each icon the reader picks. */
  onPick?: (name: string) => void;
  /**
   * The usage snippet of the icon `glyph` of `set`; the web's, a control playing it from pointer and focus,
   * when left out.
   */
  usage?: (set: string, glyph: string) => string;
}

/** How long typing pauses before the URL takes what the box holds. */
const PAUSE_MS = 300;

/** How a web app imports and holds the icon `glyph` of `set`, at the path the CLI writes it to. */
function iconGalleryUsage(set: string, glyph: string): string {
  const name = iconExportName(glyph);
  return [
    "import { useRef } from 'react';",
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

interface IconGalleryInstallProps {
  name: string;
  /** The usage snippet the panel shows. */
  usage: string;
  glyph: string;
  /** Takes focus and comes into view each time `name` changes after the first draw. */
  pickCount: number;
}

/**
 * The install line and the usage of the picked icon, under its glyph's name. Each pick moves focus to
 * that name and brings the panel into view, so a keyboard, a screen reader and a phone all land on what
 * the pick showed, which follows the whole grid.
 */
function IconGalleryInstall({ name, usage, glyph, pickCount }: IconGalleryInstallProps) {
  const headingId = useId();
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (pickCount === 0) return;
    heading.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: 'nearest' });
  }, [pickCount]);

  return (
    <section ref={panel} aria-labelledby={headingId} data-slot="icon-gallery-install" className="flex flex-col gap-4">
      <h2 id={headingId} ref={heading} tabIndex={-1} className="font-mono text-lg font-semibold outline-none">
        {glyph}
      </h2>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Install</h3>
        <IconGalleryCode code={installLine(name)} language="bash" copyLabel="Copy the install line" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Usage</h3>
        <IconGalleryCode code={usage} language="tsx" copyLabel="Copy the usage" />
      </div>
    </section>
  );
}

/** How many icons the search leaves, that it leaves none, or that there are none to search. */
function iconGalleryStatus(total: number, count: number, query: string): string {
  if (total === 0) return 'No icons are published yet.';
  if (count === 0) return `No icon has a name holding "${query.trim()}".`;
  return count === 1 ? '1 icon' : `${count} icons`;
}

/** The query part of `href`, which a route's `read` takes. */
function iconGalleryQueryOf(href: string): string {
  const start = href.indexOf('?');
  return start === -1 ? '' : href.slice(start);
}

interface IconGalleryViewProps extends IconGalleryProps {
  search: IconSearch;
  /** The URL's search, read once the page has hydrated. */
  state: ReturnType<IconSearch['read']>['state'];
}

function IconGalleryView({
  sets,
  renderGrid,
  onPick,
  usage = iconGalleryUsage,
  search,
  state,
}: IconGalleryViewProps): ReactNode {
  const searchId = useId();
  const box = useRef<HTMLInputElement>(null);
  // The `q` the box last showed or the URL last took from it, so the URL writes the box only when it moved.
  const shown = useRef(state.q);
  const [term, setTerm] = useState(state.q);
  const shownTerm = useDeferredValue(term);
  const [picked, setPicked] = useState<string>();
  const [pickCount, setPickCount] = useState(0);

  // Text typed before the page hydrated sits in the box with no change behind it.
  useEffect(() => {
    if (box.current !== null) setTerm(box.current.value);
  }, []);

  // Back, a link or the reader's own submit moved the URL's `q`: the box and the grid follow it.
  useEffect(() => {
    if (shown.current === state.q) return;
    shown.current = state.q;
    if (box.current !== null) box.current.value = state.q;
    setTerm(state.q);
  }, [state.q]);

  // A pause in the typing replaces the URL's entry; only the submit adds one. Both go through the history
  // API rather than the host's router: a search changes nothing the server drew, so the page neither asks
  // the server again nor scrolls to the top, and the host's router reads the entry back as it reads any.
  useEffect(() => {
    const href = search.build(state, { q: term });
    const q = search.read(iconGalleryQueryOf(href)).state.q;
    if (q === shown.current) return;
    const timer = setTimeout(() => {
      shown.current = q;
      window.history.replaceState(null, '', href);
    }, PAUSE_MS);
    return () => clearTimeout(timer);
  }, [term, search, state]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const href = search.fromForm(new FormData(event.currentTarget));
    const q = search.read(iconGalleryQueryOf(href)).state.q;
    shown.current = q;
    setTerm(q);
    window.history.pushState(null, '', href);
  };

  const pick = (name: string): void => {
    setPicked(name);
    setPickCount((count) => count + 1);
    onPick?.(name);
  };

  const total = sets.reduce((sum, { icons }) => sum + icons.length, 0);
  const count = filterIconSets(sets, shownTerm).reduce((sum, { icons }) => sum + icons.length, 0);
  const pickedIcon = sets
    .flatMap(({ set, icons }) => icons.map((icon) => ({ set, ...icon })))
    .find((icon) => icon.name === picked);

  return (
    <div data-slot="icon-gallery" className="flex flex-col gap-6">
      <div role="search" aria-label="Icons" className="flex flex-col gap-2">
        <form method="get" action={search.build()} onSubmit={submit}>
          <label htmlFor={searchId} className="sr-only">
            Search icons
          </label>
          <Input
            ref={box}
            id={searchId}
            type="search"
            name="q"
            placeholder="Search icons"
            autoComplete="off"
            defaultValue={state.q}
            onChange={(event) => setTerm(event.target.value)}
          />
          {search.carried(state, { except: ['q'] }).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
        <p role="status" className="text-muted-foreground text-sm">
          {iconGalleryStatus(total, count, shownTerm)}
        </p>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">{renderGrid({ query: shownTerm, picked, onPick: pick })}</div>
        <div className="lg:sticky lg:top-20 lg:w-96">
          {pickedIcon ? (
            <IconGalleryInstall
              name={pickedIcon.name}
              usage={usage(pickedIcon.set, pickedIcon.glyph)}
              glyph={pickedIcon.glyph}
              pickCount={pickCount}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Pick an icon to see its install line and its usage.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The icons of `sets`: a search box narrowing them by name, the grid `renderGrid` draws for what the
 * reader typed, and, for the icon the reader picks there, its install line and usage. The search is a GET
 * form whose `q` the page's URL holds, so a pasted link opens on the same search; typing narrows the grid
 * at once and replaces the URL's entry at each pause. The grid is drawn for the typed text a beat behind
 * the box, so typing stays quick while a long grid redraws.
 */
function IconGallery(props: IconGalleryProps): ReactNode {
  const host = useHost();
  const pathname = host.usePathname();
  const params = host.useSearchParams();
  const search = useMemo(() => iconSearch(pathname), [pathname]);
  // The page is rendered once at build with no query and no Suspense boundary to fall back to, so the
  // server drew every icon and an empty box; the URL's `q` drawn before hydration ends would not match it.
  // A boundary here would draw the whole grid twice into the page, once as its fallback.
  const { state } = search.read(useHydrated() ? params : '');
  return <IconGalleryView {...props} search={search} state={state} />;
}

export { IconGallery };
