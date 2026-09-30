'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { useIconAnimation } from '@/hooks/use-icon-animation';
import { pageTreeGroups } from '@/lib/page-tree';
import { CommandMenu, CommandMenuItem } from '@/registry/bases/base-ui/components/navigation/command-menu';
import { useCommandShortcut } from '@/registry/bases/base-ui/hooks/use-command-shortcut';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CommandEmpty, CommandGroup, CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';
import { Kbd, KbdGroup } from '@/registry/bases/base-ui/ui/kbd';
import { SearchIcon, type SearchIconHandle } from '@/registry/bases/base-ui/ui/search';
import type { SiteNavItem } from '@/types/site-nav-item';

/** Reads the index `/api/search` exports at build, once, and searches it in the browser. */
const searchClient = staticClient();

/** Whether this browser runs on macOS, where the search shortcut is Command-K rather than Ctrl+K. */
function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
}

interface DocsSearchProps {
  /** The docs page tree, whose groups the menu lists and filters as the query is typed. */
  tree: Root;
  /** The site's sections, listed first. */
  navItems?: SiteNavItem[];
}

/**
 * The docs search, the registry's `CommandMenu`, opened from the header, by Ctrl+K or Cmd+K, or by `/`
 * outside a field. It lists the site's sections and the docs' pages, filtered by the query, and below
 * them the headings and text the search index finds. Choosing one navigates to it; closing it drops
 * the query.
 */
function DocsSearch({ tree, navItems = [] }: DocsSearchProps): ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Stable for the server and the first client render, then corrected once mounted, so hydration
  // never compares a platform-specific hint against the one it prerendered. macOS draws its Command key
  // as the place-of-interest sign, which the source spells as an escape to stay plain ASCII.
  const [modifierKey, setModifierKey] = useState('Ctrl');
  const searchIcon = useIconAnimation<SearchIconHandle>();
  const { search, setSearch, query } = useDocsSearch({ client: searchClient });
  const groups = useMemo(() => pageTreeGroups(tree), [tree]);

  useEffect(() => {
    if (isMac()) setModifierKey('\u2318');
  }, []);

  const onOpenChange = (next: boolean): void => {
    setOpen(next);
    if (!next) setSearch('');
  };

  // Ctrl+K belongs to a field the page has focused, but the menu's own input hands it back to close.
  useCommandShortcut({ key: 'k', ignoreEditable: !open, onTrigger: () => onOpenChange(!open) });
  useCommandShortcut({ key: '/', mod: false, ignoreEditable: true, onTrigger: () => onOpenChange(true) });

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
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} {...searchIcon.handlers}>
          <SearchIcon ref={searchIcon.ref} />
          <span className="sr-only">Search documentation</span>
        </Button>
      </div>
      <CommandMenu
        open={open}
        onOpenChange={onOpenChange}
        title="Search documentation"
        description="Find a page or a heading."
      >
        <CommandInput placeholder="Search documentation..." onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>{query.isLoading ? 'Searching...' : 'No results found.'}</CommandEmpty>
          {navItems.length > 0 ? (
            <CommandGroup heading="Sections">
              {navItems.map((item) => (
                <CommandMenuItem
                  key={item.href}
                  value={`section ${item.href}`}
                  keywords={[item.label]}
                  onSelect={() => router.push(item.href)}
                >
                  {item.label}
                </CommandMenuItem>
              ))}
            </CommandGroup>
          ) : null}
          {groups.map((group) => (
            <CommandGroup key={group.pages[0]?.url} heading={group.name}>
              {group.pages.map((page) => (
                <CommandMenuItem
                  key={page.url}
                  value={`page ${page.url}`}
                  keywords={[String(page.name ?? ''), String(group.name ?? '')]}
                  onSelect={() => router.push(page.url)}
                >
                  {page.name}
                </CommandMenuItem>
              ))}
            </CommandGroup>
          ))}
          <DocsSearchResults query={query} search={search} onSelect={(url) => router.push(url)} />
        </CommandList>
      </CommandMenu>
    </>
  );
}

type DocsSearchQuery = ReturnType<typeof useDocsSearch>['query'];

interface DocsSearchResultsProps {
  query: DocsSearchQuery;
  search: string;
  /** Called with the chosen result's URL. */
  onSelect: (url: string) => void;
}

/**
 * What the index finds: headings and text. A page hit is left out, since every page is already listed
 * by name above, and a one-word text hit or a repeated text says nothing new. The index has matched
 * these already, stemmed words included, so the menu's own filter never hides them.
 */
function DocsSearchResults({ query, search, onSelect }: DocsSearchResultsProps): ReactNode {
  const results = useMemo(() => {
    if (!Array.isArray(query.data)) return [];
    return query.data.filter(
      (item, index, all) =>
        item.type !== 'page' &&
        !(item.type === 'text' && item.content.trim().split(/\s+/).length <= 1) &&
        index === all.findIndex((other) => other.content === item.content),
    );
  }, [query.data]);

  if (!search.trim() || results.length === 0) return null;

  return (
    <CommandGroup heading="Search results" forceMount>
      {results.map((item) => (
        <CommandMenuItem key={item.id} value={`result ${item.id}`} forceMount onSelect={() => onSelect(item.url)}>
          <span className="truncate">
            <DocsSearchResultMarks text={item.content.replace(/`/g, '')} />
          </span>
        </CommandMenuItem>
      ))}
    </CommandGroup>
  );
}

/** `text` with each term the index marked drawn in bold. */
function DocsSearchResultMarks({ text }: { text: string }): ReactNode {
  return text
    .split(/<mark>(.*?)<\/mark>/g)
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

export { DocsSearch };
