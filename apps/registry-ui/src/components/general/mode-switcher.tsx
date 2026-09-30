'use client';

import { useTheme } from 'next-themes';
import { useCallback, useRef, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { SunMoonIcon, type SunMoonIconHandle } from '@/registry/bases/base-ui/ui/sun-moon';

interface ModeSwitcherProps {
  variant?: ComponentProps<typeof Button>['variant'];
  className?: string;
}

/** A button that switches the site between its light and dark theme; its icon plays on the button's hover or focus. */
function ModeSwitcher({ variant = 'ghost', className }: ModeSwitcherProps): ReactNode {
  const { setTheme, resolvedTheme } = useTheme();
  const iconRef = useRef<SunMoonIconHandle>(null);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn('group/toggle extend-touch-target size-8', className)}
      onClick={toggleTheme}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      onFocus={() => iconRef.current?.startAnimation()}
      onBlur={() => iconRef.current?.stopAnimation()}
    >
      <SunMoonIcon ref={iconRef} className="[&_svg]:size-4.5!" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ModeSwitcher };
