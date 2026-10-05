import * as React from 'react';

export interface UseCommandShortcutOptions {
  /** Key to match, case-insensitive - e.g. `'k'`. */
  key: string;
  /**
   * Require the platform command modifier (Command on macOS, Ctrl elsewhere).
   * Default `true`.
   */
  mod?: boolean;
  /** Called when the chord is pressed. */
  onTrigger: () => void;
  /** Disable the listener without unmounting. Default `true` (enabled). */
  enabled?: boolean;
  /**
   * Leave the key to a text field, a select or an editable element that has
   * focus, so `/` still types a slash there. Default `false`.
   */
  ignoreEditable?: boolean;
}

/** Whether a key press lands where the key is text: a field, a select or an editable element. */
function isEditable(target: EventTarget | null): boolean {
  return (
    (target instanceof HTMLElement && target.isContentEditable) ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Registers a global keyboard shortcut (default Cmd or Ctrl + key) and calls
 * `onTrigger`. The side-effect lives in the consumer's component by design -
 * use it to open a `CommandMenu`. The latest `onTrigger` is always called
 * without re-binding the listener.
 */
export function useCommandShortcut({
  key,
  mod = true,
  onTrigger,
  enabled = true,
  ignoreEditable = false,
}: UseCommandShortcutOptions): void {
  const handler = React.useRef(onTrigger);
  handler.current = onTrigger;

  React.useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      const modPressed = mod ? event.metaKey || event.ctrlKey : true;
      if (ignoreEditable && isEditable(event.target)) return;
      if (modPressed && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        handler.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return (): void => document.removeEventListener('keydown', onKeyDown);
  }, [key, mod, enabled, ignoreEditable]);
}
