'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { DEFAULT_PLATFORM_STYLE, PLATFORM_STYLE_LABELS, PLATFORM_STYLES } from '@/constants/platform-styles';
import { rememberStyle, useRememberedStyle } from '@/hooks/use-remembered-choice';
import { currentStyle, STYLE_PARAM, styleHref } from '@/lib/style-choice';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import type { Platform, PlatformStyle } from '@/types/platform';

interface StylePickerProps {
  /** Whose styles it lists, and whose remembered choice it reads and writes. */
  platform: Platform;
}

/**
 * The registry style the page's snippets are written in, as a menu of links to this page in each of
 * `platform`'s styles. A link writes `?style=` only for a style other than the default, and following
 * one remembers it as the reader's choice on this platform. The URL's style wins over the remembered one.
 */
function StylePicker({ platform }: StylePickerProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page shows the default.
    <Suspense fallback={<StylePickerMenu platform={platform} style={DEFAULT_PLATFORM_STYLE[platform]} search="" />}>
      <StylePickerFromUrl platform={platform} />
    </Suspense>
  );
}

function StylePickerFromUrl({ platform }: StylePickerProps): ReactNode {
  const searchParams = useSearchParams();
  const style = currentStyle(platform, searchParams.get(STYLE_PARAM), useRememberedStyle(platform));
  return <StylePickerMenu platform={platform} style={style} search={searchParams.toString()} />;
}

interface StylePickerMenuProps extends StylePickerProps {
  style: PlatformStyle;
  /** The page's query, which every link keeps beside the style it writes. */
  search: string;
}

function StylePickerMenu({ platform, style, search }: StylePickerMenuProps): ReactNode {
  const pathname = usePathname();
  const styles: readonly PlatformStyle[] = PLATFORM_STYLES[platform];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-slot="style-picker" render={<Button variant="ghost" size="sm" />}>
        <span className="text-muted-foreground">Style</span> {PLATFORM_STYLE_LABELS[style]}
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Style</DropdownMenuLabel>
          {styles.map((option) => (
            <MenuPrimitive.LinkItem
              key={option}
              closeOnClick
              render={
                <Link
                  href={styleHref(pathname, search, platform, option)}
                  aria-current={option === style ? 'page' : undefined}
                  onClick={() => rememberStyle(platform, option)}
                />
              }
              className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none"
            >
              {PLATFORM_STYLE_LABELS[option]}
              {option === style ? <CheckIcon className="size-4" /> : null}
            </MenuPrimitive.LinkItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { StylePicker };
