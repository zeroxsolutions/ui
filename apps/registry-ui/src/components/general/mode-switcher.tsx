'use client';

import { useTheme } from 'next-themes';
import { useCallback, type ReactNode } from 'react';

import { useIconAnimation } from '@/hooks/use-icon-animation';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { SunMoonIcon, type SunMoonIconHandle } from '@/registry/bases/base-ui/ui/sun-moon';

/** A button that switches the site between its light and dark theme; its icon plays on the button's hover or focus. */
function ModeSwitcher(): ReactNode {
  const { setTheme, resolvedTheme } = useTheme();
  const icon = useIconAnimation<SunMoonIconHandle>();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button data-slot="mode-switcher" variant="ghost" size="icon" onClick={toggleTheme} {...icon.handlers}>
      <SunMoonIcon ref={icon.ref} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ModeSwitcher };
