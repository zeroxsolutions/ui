'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { cva } from 'class-variance-authority';
import { Suspense, useRef, type ReactNode } from 'react';

import { useHost } from '../../../host/host-provider';
import { DEFAULT_PLATFORM_STYLE, PLATFORM_STYLE_LABELS, PLATFORM_STYLES } from '../../constants/platform-styles';
import { useCurrentStyle } from '../../hooks/use-current-style';
import { useHydrated } from '../../hooks/use-hydrated';
import { rememberStyle } from '../../hooks/use-remembered-choice';
import { styleHref } from '../../lib/style-choice';
import {
  type AnimatedIconHandle,
  useAnimatedActive,
  useAnimatedIcon,
  usePlayWhile,
} from '../../../../registry/bases/base-ui/hooks/use-animated-icon';
import { CheckIcon } from '../../../../registry/bases/base-ui/icons/lucide/check-icon';
import { ChevronDownIcon } from '../../../../registry/bases/base-ui/icons/lucide/chevron-down-icon';
import { Button } from '../../../../registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../../registry/bases/base-ui/ui/dropdown-menu';
import type { Platform, PlatformStyle } from '../../types/platform';

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
  const search = useHost().useSearchParams().toString();
  // A page rendered once at build holds no query, and hydration keeps the server's href over the client's.
  return <StylePickerMenu platform={platform} style={useCurrentStyle(platform)} search={useHydrated() ? search : ''} />;
}

interface StylePickerMenuProps extends StylePickerProps {
  style: PlatformStyle;
  /** The page's query, which every link keeps beside the style it writes. */
  search: string;
}

function StylePickerMenu({ platform, style, search }: StylePickerMenuProps): ReactNode {
  const { usePathname } = useHost();
  const pathname = usePathname();
  const styles: readonly PlatformStyle[] = PLATFORM_STYLES[platform];
  const chevron = useAnimatedIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-slot="style-picker" render={<Button variant="ghost" size="sm" {...chevron.handlers} />}>
        <span className="text-muted-foreground">Style</span> <StylePickerLabel platform={platform} style={style} />
        <ChevronDownIcon ref={chevron.ref} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Style</DropdownMenuLabel>
          {styles.map((option) => (
            <StyleRow
              key={option}
              label={PLATFORM_STYLE_LABELS[option]}
              href={styleHref(pathname, search, platform, option)}
              selected={option === style}
              onChoose={() => rememberStyle(platform, option)}
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Shows a style's name only under the class `<html>` carries for that style. */
const styleLabelVariants = cva('hidden', {
  variants: {
    style: {
      nova: 'in-[.style-nova]:inline',
      luma: 'in-[.style-luma]:inline',
      lyra: 'in-[.style-lyra]:inline',
      maia: 'in-[.style-maia]:inline',
      mira: 'in-[.style-mira]:inline',
      rhea: 'in-[.style-rhea]:inline',
      sera: 'in-[.style-sera]:inline',
      vega: 'in-[.style-vega]:inline',
    } satisfies Record<PlatformStyle, string>,
  },
});

/**
 * The name of the style the page is drawn in. Until the picker hydrates, `style` is the default the server
 * rendered, while the page's inline script has already put the URL's or the remembered style's class on
 * `<html>`; so every name is drawn and that class shows the one in use.
 */
function StylePickerLabel({ platform, style }: { platform: Platform; style: PlatformStyle }): ReactNode {
  const hydrated = useHydrated();
  if (hydrated) return PLATFORM_STYLE_LABELS[style];
  return PLATFORM_STYLES[platform].map((option) => (
    <span key={option} className={styleLabelVariants({ style: option })}>
      {PLATFORM_STYLE_LABELS[option]}
    </span>
  ));
}

interface StyleRowProps {
  label: string;
  href: string;
  /** Whether it is the style in use, which marks the row with a check. */
  selected: boolean;
  onChoose: () => void;
}

/**
 * One style's row in the menu, a link drawn as the menu's item. The check on the style in use is the row's icon: it plays while the row holds
 * the pointer or the focus, which the menu moves with its highlight, and it plays for the row highlighted as
 * the menu opens, where the reader has just acted.
 */
function StyleRow({ label, href, selected, onChoose }: StyleRowProps): ReactNode {
  const { Link } = useHost();
  const icon = useRef<AnimatedIconHandle>(null);
  const { active, handlers } = useAnimatedActive();
  usePlayWhile(icon, active, { playOnFirstDraw: true });

  return (
    <MenuPrimitive.LinkItem
      closeOnClick
      render={<Link href={href} aria-current={selected ? 'page' : undefined} onClick={onChoose} />}
      data-slot="dropdown-menu-item"
      data-variant="default"
      className="cn-dropdown-menu-item group/dropdown-menu-item relative flex cursor-default items-center justify-between outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0"
      {...handlers}
    >
      {label}
      {/* The wrapper span holds the size, and `!` holds the svg to it against the item's own svg rule. */}
      {selected ? <CheckIcon ref={icon} aria-hidden className="size-4 [&_svg]:size-4!" /> : null}
    </MenuPrimitive.LinkItem>
  );
}

export { StylePicker };
