import * as React from 'react';

export interface UseCommandShortcutOptions {
  /** Key to match, case-insensitive — e.g. `'k'`. */
  key: string;
  /**
   * Require the platform command modifier (⌘ on macOS, Ctrl elsewhere).
   * Default `true`.
   */
  mod?: boolean;
  /** Called when the chord is pressed. */
  onTrigger: () => void;
  /** Disable the listener without unmounting. Default `true` (enabled). */
  enabled?: boolean;
}

/**
 * Registers a global keyboard shortcut (default ⌘/Ctrl + key) and calls
 * `onTrigger`. The side-effect lives in the consumer's component by design —
 * use it to open a `CommandSwitcher`. The latest `onTrigger` is always called
 * without re-binding the listener.
 */
export function useCommandShortcut({
  key,
  mod = true,
  onTrigger,
  enabled = true,
}: UseCommandShortcutOptions): void {
  const handler = React.useRef(onTrigger);
  handler.current = onTrigger;

  React.useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const modPressed = mod ? event.metaKey || event.ctrlKey : true;
      if (modPressed && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        handler.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key, mod, enabled]);
}
