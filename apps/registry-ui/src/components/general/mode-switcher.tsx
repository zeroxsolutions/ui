'use client';

import { SunMoonIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

/** A button that switches the site between its light and dark theme. */
function ModeSwitcher(props: ComponentProps<typeof Button>): ReactNode {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      {...props}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <SunMoonIcon />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ModeSwitcher };
