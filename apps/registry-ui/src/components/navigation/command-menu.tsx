'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/bases/base-ui/ui/command';
import { Kbd, KbdGroup } from '@/registry/bases/base-ui/ui/kbd';
import { SearchIcon, type SearchIconHandle } from '@/registry/bases/base-ui/ui/search';
import type { SiteNavItem } from '@/types/site-nav-item';

/** Reads the index `/api/search` exports at build, once, and searches it in the browser. */
const searchClient = staticClient();

/** Whether this browser runs on macOS, where the search shortcut is Command-K rather than Ctrl+K. */
function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
}

/** Whether a key press lands in a field, where Ctrl+K and `/` belong to the field rather than the search. */
function isTyping(target: EventTarget | null): boolean {
  return (
    (target instanceof HTMLElement && target.isContentEditable) ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/** Keeps an item whose text holds the query, in the order it was listed, where cmdk's own filter reorders by score. */
function filterByText(value: string, search: string, keywords?: string[]): number {
  return `${value} ${keywords?.join(' ') ?? ''}`.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
}

interface CommandMenuProps {
  /** The docs page tree, whose groups the menu lists and filters as the query is typed. */
  tree: Root;
  /** The site's sections, listed first. */
  navItems?: SiteNavItem[];
}

/**
 * The docs search, opened from the header, by Ctrl+K or Cmd+K, or by `/`. It lists the site's
 * sections and the docs' pages, filtered by the query, and below them what the search index finds.
 * Choosing one navigates to it. Closing it drops the query.
 */
function CommandMenu({ tree, navItems = [] }: CommandMenuProps): ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Stable for the server and the first client render, then corrected once mounted, so hydration
  // never compares a platform-specific hint against the one it prerendered. macOS draws its Command key
  // as the place-of-interest sign, which the source spells as an escape to stay plain ASCII.
  const [modifierKey, setModifierKey] = useState('Ctrl');
  const searchIconRef = useRef<SearchIconHandle>(null);
  const { search, setSearch, query } = useDocsSearch({ client: searchClient });
  const groups = useMemo(() => pageTreeGroups(tree), [tree]);

  useEffect(() => {
    if (isMac()) setModifierKey('\u2318');
  }, []);

  const onOpenChange = useCallback(
    (next: boolean): void => {
      setOpen(next);
      if (!next) setSearch('');
    },
    [setSearch],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!((event.key === 'k' && (event.metaKey || event.ctrlKey)) || event.key === '/')) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      onOpenChange(!open);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const go = (url: string): void => {
    onOpenChange(false);
    router.push(url);
  };

  return (
    <>
      <div className="hidden md:block">
        <Button variant="outline" className="w-48 justify-start xl:w-64" onClick={() => setOpen(true)}>
          {/* The button is named once; the width-dependent labels and the shortcut hint are what is drawn. */}
          <span className="sr-only">Search documentation</span>
          <span aria-hidden className="hidden xl:inline">
            Search documentation...
          </span>
          <span aria-hidden className="xl:hidden">
            Search...
          </span>
          <KbdGroup aria-hidden className="ml-auto">
            <Kbd>{modifierKey}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </div>
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          onMouseEnter={() => searchIconRef.current?.startAnimation()}
          onMouseLeave={() => searchIconRef.current?.stopAnimation()}
          onFocus={() => searchIconRef.current?.startAnimation()}
          onBlur={() => searchIconRef.current?.stopAnimation()}
        >
          <SearchIcon ref={searchIconRef} />
          <span className="sr-only">Search docs</span>
        </Button>
      </div>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Search documentation"
        description="Find a page or a heading."
      >
        <Command filter={filterByText}>
          <CommandInput placeholder="Search documentation..." onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{query.isLoading ? 'Searching...' : 'No results found.'}</CommandEmpty>
            {navItems.length > 0 ? (
              <CommandGroup heading="Pages">
                {navItems.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`Navigation ${item.label}`}
                    keywords={['nav', 'navigation', item.label.toLowerCase()]}
                    onSelect={() => go(item.href)}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {groups.map((group) => (
              <CommandGroup key={group.pages[0]?.url} heading={group.name}>
                {group.pages.map((page) => (
                  <CommandItem
                    key={page.url}
                    value={`${group.name ?? ''} ${page.name}`}
                    keywords={page.url.includes('/components/') ? ['component'] : undefined}
                    onSelect={() => go(page.url)}
                  >
                    {page.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandMenuSearchResults query={query} search={search} onSelect={go} />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

type CommandMenuQuery = ReturnType<typeof useDocsSearch>['query'];

interface CommandMenuSearchResultsProps {
  query: CommandMenuQuery;
  search: string;
  /** Called with the chosen result's URL. */
  onSelect: (url: string) => void;
}

/**
 * A result's text as it reads: the index marks each matched term with `<mark>` and keeps a code span's
 * Markdown backticks, and neither is text a reader should see or the filter should match.
 */
function plainResultText(content: string): string {
  return content.replace(/<\/?mark>/g, '').replace(/`/g, '');
}

function CommandMenuSearchResults({ query, search, onSelect }: CommandMenuSearchResultsProps): ReactNode {
  const results = useMemo(() => {
    if (!Array.isArray(query.data)) return [];
    // A one-word text hit is a stray fragment of a heading or a table cell; a repeated text says nothing new.
    return query.data.filter(
      (item, index, all) =>
        !(item.type === 'text' && item.content.trim().split(/\s+/).length <= 1) &&
        index === all.findIndex((other) => other.content === item.content),
    );
  }, [query.data]);

  if (!search.trim() || results.length === 0) return null;

  return (
    <CommandGroup heading="Search results">
      {results.map((item) => (
        <CommandItem
          key={item.id}
          value={`${plainResultText(item.content)} ${item.type}`}
          keywords={[plainResultText(item.content)]}
          onSelect={() => onSelect(item.url)}
        >
          <span className="truncate">
            <CommandMenuSearchResultMarks text={item.content.replace(/`/g, '')} />
          </span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/** `text` with each term the index marked drawn in bold. */
function CommandMenuSearchResultMarks({ text }: { text: string }): ReactNode {
  return text
    .split(/<mark>(.*?)<\/mark>/g)
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

export { CommandMenu };
