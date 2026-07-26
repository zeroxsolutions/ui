'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

import { Button, buttonVariants } from '@zeroxsolutions/ui/components/ui/button';
import { cn } from '@zeroxsolutions/ui/lib/utils';

import { DarkModeToggle } from './dark-mode-toggle';

/** The top-level sections - the registry's three ecosystem tiers. */
const SECTION_LINKS = [
  { label: 'Components', href: '/components' },
  { label: 'Blocks', href: '/blocks' },
  { label: 'Pages', href: '/pages' },
] as const;

/**
 * The sticky top-nav: the wordmark, the section links (visible on every viewport
 * - no desktop-only nav), a search trigger Button, and the icon theme toggle.
 * Every element is a shipped primitive (Button / buttonVariants) - no sidebar,
 * no SidebarTrigger.
 */
export function SiteHeader() {
  return (
    <header
      data-slot="site-header"
      className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-4 sm:gap-2">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight"
        >
          @zeroxsolutions/ui
        </Link>

        <nav aria-label="Sections" className="flex items-center gap-1">
          {SECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-slot="site-header-link"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* TODO: open a Cmd+K Command palette filtering the catalog. */}
          <Button
            type="button"
            variant="outline"
            data-slot="search-trigger"
            className="text-muted-foreground"
          >
            <Search />
            <span className="hidden sm:inline">Search docs</span>
            <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
              ⌘K
            </kbd>
          </Button>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
