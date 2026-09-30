'use client';

import { useTheme } from 'next-themes';
import { useCallback, useRef, type ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { SunMoonIcon, type SunMoonIconHandle } from '@/registry/bases/base-ui/ui/sun-moon';

/** A button that switches the site between its light and dark theme; its icon plays on the button's hover or focus. */
function ModeSwitcher(): ReactNode {
  const { setTheme, resolvedTheme } = useTheme();
  const iconRef = useRef<SunMoonIconHandle>(null);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      onFocus={() => iconRef.current?.startAnimation()}
      onBlur={() => iconRef.current?.stopAnimation()}
    >
      <SunMoonIcon ref={iconRef} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ModeSwitcher };
