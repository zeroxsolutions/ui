'use client';

import { useEffect, useState } from 'react';

import { Toggle } from '@zeroxsolutions/ui/components/ui/toggle';

const DARK_CLASS = 'dark';

/**
 * Toggles the design system's dark mode by flipping the `.dark` class on
 * `<html>` - the variant the Tailwind v4 `@custom-variant dark (&:is(.dark *))`
 * rule (registered by `@zeroxsolutions/ui/styles.css`) listens for. The
 * registry app keeps the simplest mechanism the design leaves open: no
 * `next-themes` dependency, no persistence beyond the rendered session, and a
 * text-only label so the app pulls no extra icon dependency.
 */
export function DarkModeToggle() {
  // The initial state is read from the document on mount so a hydration
  // mismatch is avoided (the server renders `pressed=false`, the client
  // resolves to whatever `<html>` carries).
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setPressed(document.documentElement.classList.contains(DARK_CLASS));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, pressed);
  }, [pressed]);

  return (
    <Toggle
      data-slot="dark-mode-toggle"
      aria-label={pressed ? 'Switch to light mode' : 'Switch to dark mode'}
      pressed={pressed}
      onPressedChange={setPressed}
      variant="outline"
    >
      {pressed ? 'Light' : 'Dark'}
    </Toggle>
  );
}
