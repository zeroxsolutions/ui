'use client';

import { useTheme } from 'next-themes';
import { useCallback, type ReactNode } from 'react';

import { useHydrated } from '../../hooks/use-hydrated';
import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';

import { Button } from '../../../../registry/bases/base-ui/ui/button';
import { SunMoonIcon } from '../../../../registry/bases/base-ui/icons/lucide/sun-moon-icon';

/**
 * A button that switches the site between its light and dark theme; its icon plays on the button's hover or focus.
 * It is disabled until the page has hydrated, as the theme it switches from is only known in the browser.
 */
function ModeSwitcher(): ReactNode {
  const { setTheme, resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const icon = useAnimatedIcon();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      data-slot="mode-switcher"
      variant="ghost"
      size="icon"
      disabled={!hydrated}
      onClick={toggleTheme}
      {...icon.handlers}
    >
      <SunMoonIcon ref={icon.ref} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ModeSwitcher };
