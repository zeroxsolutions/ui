'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

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

/** Reads the index `/api/search` exports at build, once, and searches it in the browser. */
const searchClient = staticClient();

/** Whether a key press lands in a field the user is typing into, where `/` is a character and not a shortcut. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/** Whether this browser runs on macOS, where the search shortcut is Cmd+K rather than Ctrl+K. */
function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
}

/**
 * A search box that opens on Ctrl+K, Cmd+K or `/`, and closes on Escape. Empty, it lists the docs'
 * pages; with a query, the pages and headings the search index finds. Choosing one navigates to it.
 */
function CommandMenu({ tree }: { tree: Root }): ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Stable for the server and the first client render, then corrected once mounted, so hydration
  // never compares a platform-specific hint against the one it prerendered.
  const [modifierKey, setModifierKey] = useState('Ctrl');
  const { search, setSearch, query } = useDocsSearch({ client: searchClient });

  useEffect(() => {
    if (isMac()) setModifierKey('Cmd');
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !isTyping(event.target))) {
        event.preventDefault();
        setOpen(true);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function go(url: string): void {
    setOpen(false);
    router.push(url);
  }

  const results = search.trim() && Array.isArray(query.data) ? query.data : [];

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground hidden w-56 justify-start md:inline-flex"
        onClick={() => setOpen(true)}
      >
        <SearchIcon data-icon="inline-start" />
        Search docs...
        <KbdGroup className="ml-auto">
          <Kbd>{modifierKey}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <SearchIcon />
        <span className="sr-only">Search docs</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search docs" description="Find a page or a heading.">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search docs..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{query.isLoading ? 'Searching...' : 'No results found.'}</CommandEmpty>
            {search.trim() ? (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem key={result.id} value={result.id} onSelect={() => go(result.url)}>
                    <CommandMenuResult content={result.content} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              pageTreeGroups(tree).map((group) => (
                <CommandGroup key={group.pages[0]?.url} heading={group.name}>
                  {group.pages.map((page) => (
                    <CommandItem key={page.url} value={page.url} onSelect={() => go(page.url)}>
                      {page.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

/**
 * A result's text on one line; the index marks each matched term with `<mark>`, drawn bold here. One
 * span holds it all, so the item's flex layout does not split the text at each mark.
 */
function CommandMenuResult({ content }: { content: string }): ReactNode {
  return (
    <span className="line-clamp-1">
      {content.split(/<mark>(.*?)<\/mark>/g).map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="text-foreground bg-transparent font-semibold">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export { CommandMenu };
