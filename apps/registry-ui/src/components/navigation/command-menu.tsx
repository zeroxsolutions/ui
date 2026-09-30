'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import type { Root } from 'fumadocs-core/page-tree';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { useRouter } from 'next/navigation';
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { useMutationObserver } from '@/hooks/use-mutation-observer';
import { pageTreeGroups } from '@/lib/page-tree';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ArrowRightIcon, type ArrowRightIconHandle } from '@/registry/bases/base-ui/ui/arrow-right';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/bases/base-ui/ui/command';
import { CornerDownLeftIcon } from '@/registry/bases/base-ui/ui/corner-down-left';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/registry/bases/base-ui/ui/dialog';
import { Kbd, KbdGroup } from '@/registry/bases/base-ui/ui/kbd';
import { SearchIcon, type SearchIconHandle } from '@/registry/bases/base-ui/ui/search';
import { Spinner } from '@/registry/bases/base-ui/ui/spinner';
import type { SiteNavItem } from '@/types/site-nav-item';

/** Reads the index `/api/search` exports at build, once, and searches it in the browser. */
const searchClient = staticClient();

/** Whether this browser runs on macOS, where the search shortcut is Cmd+K rather than Ctrl+K. */
function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
}

interface CommandMenuProps {
  /** The docs page tree, whose groups the menu lists and filters as the query is typed. */
  tree: Root;
  navItems?: SiteNavItem[];
}

/**
 * The docs search, opened from the header, by Ctrl+K or Cmd+K, or by `/`. It lists the site's
 * sections and the docs' pages, filtered by the query, and below them what the search index finds.
 * Choosing one navigates to it.
 */
function CommandMenu({ tree, navItems }: CommandMenuProps): ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [renderDelayedGroups, setRenderDelayedGroups] = useState(false);
  const [selectedType, setSelectedType] = useState<'page' | 'component' | null>(null);
  // Stable for the server and the first client render, then corrected once mounted, so hydration
  // never compares a platform-specific hint against the one it prerendered.
  const [modifierKey, setModifierKey] = useState('Ctrl');
  const searchIconRef = useRef<SearchIconHandle>(null);
  const { search, setSearch, query } = useDocsSearch({ client: searchClient });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      // The index is searched once typing pauses, not on every key.
      searchTimeoutRef.current = setTimeout(() => {
        startTransition(() => setSearch(value));
      }, 500);
    },
    [setSearch],
  );

  useEffect(() => {
    if (isMac()) setModifierKey('Cmd');
  }, []);

  // The page groups render a frame after the dialog opens, so the dialog itself paints at once.
  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setRenderDelayedGroups(true));
      return () => cancelAnimationFrame(frame);
    }

    setRenderDelayedGroups(false);
    return undefined;
  }, [open]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const commandFilter = useCallback((value: string, searchValue: string, keywords?: string[]) => {
    const extendValue = value + ' ' + (keywords?.join(' ') || '');
    return extendValue.toLowerCase().includes(searchValue.toLowerCase()) ? 1 : 0;
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const navItemsSection = useMemo(() => {
    if (!navItems || navItems.length === 0) return null;

    return (
      <CommandGroup
        heading="Pages"
        className="p-0! **:[[cmdk-group-heading]]:scroll-mt-16 **:[[cmdk-group-heading]]:p-3! **:[[cmdk-group-heading]]:pb-1!"
      >
        {navItems.map((item) => (
          <CommandMenuItem
            key={item.href}
            value={`Navigation ${item.label}`}
            keywords={['nav', 'navigation', item.label.toLowerCase()]}
            onHighlight={() => setSelectedType('page')}
            onSelect={() => runCommand(() => router.push(item.href))}
          >
            <CommandMenuArrowIcon />
            {item.label}
          </CommandMenuItem>
        ))}
      </CommandGroup>
    );
  }, [navItems, runCommand, router]);

  const pageGroupsSection = useMemo(() => {
    return pageTreeGroups(tree).map((group) => (
      <CommandGroup
        key={group.pages[0]?.url}
        heading={group.name}
        className="p-0! **:[[cmdk-group-heading]]:scroll-mt-16 **:[[cmdk-group-heading]]:p-3! **:[[cmdk-group-heading]]:pb-1!"
      >
        {group.pages.map((item) => {
          const isComponent = item.url.includes('/components/');

          return (
            <CommandMenuItem
              key={item.url}
              value={item.name?.toString() ? `${group.name ?? ''} ${item.name}` : ''}
              keywords={isComponent ? ['component'] : undefined}
              onHighlight={() => setSelectedType(isComponent ? 'component' : 'page')}
              onSelect={() => runCommand(() => router.push(item.url))}
            >
              {isComponent ? (
                <div className="border-muted-foreground aspect-square size-4 rounded-full border border-dashed" />
              ) : (
                <CommandMenuArrowIcon />
              )}
              {item.name}
            </CommandMenuItem>
          );
        })}
      </CommandGroup>
    ));
  }, [tree, runCommand, router]);

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="bg-muted text-foreground hover:bg-muted/50 dark:bg-card relative hidden h-8 w-full justify-start rounded-lg border-none pl-3 shadow-none transition-colors md:inline-flex md:w-48 lg:w-40 xl:w-64"
          />
        }
      >
        <span className="hidden xl:inline-flex">Search documentation...</span>
        <span className="inline-flex xl:hidden">Search...</span>
        <div className="absolute top-1.5 right-1.5 hidden gap-1 sm:flex">
          <KbdGroup>
            <Kbd className="border">{modifierKey}</Kbd>
            <Kbd className="border">K</Kbd>
          </KbdGroup>
        </div>
      </DialogTrigger>
      <Button
        variant="ghost"
        size="icon"
        className="extend-touch-target size-8 md:hidden"
        onClick={() => setOpen(true)}
        onMouseEnter={() => searchIconRef.current?.startAnimation()}
        onMouseLeave={() => searchIconRef.current?.stopAnimation()}
        onFocus={() => searchIconRef.current?.startAnimation()}
        onBlur={() => searchIconRef.current?.stopAnimation()}
      >
        <SearchIcon ref={searchIconRef} />
        <span className="sr-only">Search docs</span>
      </Button>
      <CommandMenuDialogContent className="rounded-xl border-none bg-clip-padding p-2 pb-11 shadow-2xl ring-4 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-800">
        <DialogHeader className="sr-only">
          <DialogTitle>Search documentation...</DialogTitle>
          <DialogDescription>Search for a command to run...</DialogDescription>
        </DialogHeader>
        <Command
          className="**:data-[slot=input-group]:border-input! **:data-[slot=input-group]:bg-input/50! rounded-none bg-transparent **:data-[slot=command-input]:h-9! **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:mb-0 **:data-[slot=input-group]:h-9! **:data-[slot=input-group]:rounded-md!"
          filter={commandFilter}
        >
          <div className="relative">
            <CommandInput placeholder="Search documentation..." onValueChange={handleSearchChange} />
            {query.isLoading && (
              <div className="pointer-events-none absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center justify-center">
                <Spinner className="text-muted-foreground size-4" />
              </div>
            )}
          </div>
          <CommandList className="no-scrollbar min-h-80 scroll-pt-2 scroll-pb-1.5">
            <CommandEmpty className="text-muted-foreground py-12 text-center text-sm">
              {query.isLoading ? 'Searching...' : 'No results found.'}
            </CommandEmpty>
            {navItemsSection}
            {renderDelayedGroups ? (
              <>
                {pageGroupsSection}
                <CommandMenuSearchResults setOpen={setOpen} query={query} search={search} />
              </>
            ) : null}
          </CommandList>
        </Command>
        <div className="text-muted-foreground absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-2 rounded-b-xl border-t border-t-neutral-100 bg-neutral-50 px-4 text-xs font-medium dark:border-t-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2">
            <CommandMenuKbd>
              <CornerDownLeftIcon />
            </CommandMenuKbd>{' '}
            {selectedType === 'page' || selectedType === 'component' ? 'Go to page' : null}
          </div>
        </div>
      </CommandMenuDialogContent>
    </Dialog>
  );
}

/** Whether the command item around it is the one the keyboard or the pointer has selected. */
const CommandMenuItemHighlightContext = createContext(false);

interface CommandMenuItemProps extends ComponentProps<typeof CommandItem> {
  /** Called each time this item becomes the selected one. */
  onHighlight?: () => void;
}

function CommandMenuItem({ children, className, onHighlight, ...props }: CommandMenuItemProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(false);

  useMutationObserver(ref, (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-selected') {
        const selected = ref.current?.getAttribute('aria-selected') === 'true';
        setHighlighted(selected);
        if (selected) onHighlight?.();
      }
    }
  });

  return (
    <CommandItem
      ref={ref}
      className={cn(
        'data-[selected=true]:border-input data-[selected=true]:bg-input/50 h-9 rounded-md border border-transparent px-3! font-medium',
        className,
      )}
      {...props}
    >
      <CommandMenuItemHighlightContext.Provider value={highlighted}>
        {children}
      </CommandMenuItemHighlightContext.Provider>
    </CommandItem>
  );
}

/** The arrow a page item leads with; it plays while its item is selected. */
function CommandMenuArrowIcon(): ReactNode {
  const highlighted = useContext(CommandMenuItemHighlightContext);
  const iconRef = useRef<ArrowRightIconHandle>(null);

  useEffect(() => {
    if (highlighted) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [highlighted]);

  return <ArrowRightIcon ref={iconRef} />;
}

function CommandMenuKbd({ className, ...props }: ComponentProps<'kbd'>): ReactNode {
  return (
    <kbd
      className={cn(
        "bg-background text-muted-foreground pointer-events-none flex h-5 items-center justify-center gap-1 rounded border px-1 font-sans text-[0.7rem] font-medium select-none [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}

type CommandMenuQuery = ReturnType<typeof useDocsSearch>['query'];

interface CommandMenuSearchResultsProps {
  setOpen: (open: boolean) => void;
  query: CommandMenuQuery;
  search: string;
}

/** The index marks each matched term with `<mark>`; the item's filter and its name read the text without them. */
function withoutMarks(content: string): string {
  return content.replace(/<\/?mark>/g, '');
}

function CommandMenuSearchResults({ setOpen, query, search }: CommandMenuSearchResultsProps): ReactNode {
  const router = useRouter();

  const uniqueResults = useMemo(() => {
    if (!query.data || !Array.isArray(query.data)) return [];

    return query.data.filter(
      (item, index, self) =>
        !(item.type === 'text' && item.content.trim().split(/\s+/).length <= 1) &&
        index === self.findIndex((t) => t.content === item.content),
    );
  }, [query.data]);

  if (!search.trim() || !query.data || query.data === 'empty' || uniqueResults.length === 0) return null;

  return (
    <CommandGroup
      className="px-0! **:[[cmdk-group-heading]]:scroll-mt-16 **:[[cmdk-group-heading]]:p-3! **:[[cmdk-group-heading]]:pb-1!"
      heading="Search results"
    >
      {uniqueResults.map((item) => (
        <CommandItem
          key={item.id}
          data-type={item.type}
          onSelect={() => {
            router.push(item.url);
            setOpen(false);
          }}
          className="data-[selected=true]:border-input data-[selected=true]:bg-input/50 h-9 rounded-md border border-transparent px-3! font-normal"
          keywords={[withoutMarks(item.content)]}
          value={`${withoutMarks(item.content)} ${item.type}`}
        >
          <CommandMenuSearchResultText content={item.content} />
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/**
 * A result's text on one line, each matched term drawn bold. One element holds it all, so the item's
 * flex layout does not split the text at each mark.
 */
function CommandMenuSearchResultText({ content }: { content: string }): ReactNode {
  return (
    <div className="line-clamp-1 text-sm">
      {content.split(/<mark>(.*?)<\/mark>/g).map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="text-foreground bg-transparent font-semibold">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </div>
  );
}

/** Upstream's own dialog frame for the menu: no backdrop, and pinned near the top rather than centred. */
function CommandMenuDialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props): ReactNode {
  return (
    <DialogPortal>
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'bg-background fixed top-[15%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

export { CommandMenu };
