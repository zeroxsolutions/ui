'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@zeroxsolutions/ui/components/ui/button';

const DARK_CLASS = 'dark';

/**
 * Toggles the design system's dark mode by flipping the `.dark` class on
 * `<html>` - the variant the Tailwind v4 `@custom-variant dark (&:is(.dark *))`
 * rule (registered by `@zeroxsolutions/ui/styles.css`) listens for. The icon
 * shows the mode a click will switch *to* (Moon while light, Sun while dark),
 * matching the shadcn theme-toggle; the initial state is read from the
 * document on mount so a hydration mismatch is avoided.
 */
export function DarkModeToggle() {
  // The server renders `isDark=false`; the client resolves to whatever
  // `<html>` carries on mount.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains(DARK_CLASS));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
  }, [isDark]);

  return (
    <Button
      type="button"
      data-slot="dark-mode-toggle"
      variant="outline"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setIsDark((value) => !value)}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
