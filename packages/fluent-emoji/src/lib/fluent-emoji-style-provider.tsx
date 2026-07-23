import * as React from 'react';

import { setFluentEmojiStyle, type FluentEmojiStyle } from './fluent-emoji-url';

interface FluentEmojiStyleContextValue {
  /** The ambient artwork style every `<FluentEmoji>` (without its own `variant`)
   *  resolves to. */
  style: FluentEmojiStyle;
  /** Switch the ambient style; re-renders every subscribed `<FluentEmoji>`. */
  setStyle: (style: FluentEmojiStyle) => void;
}

const FluentEmojiStyleContext =
  React.createContext<FluentEmojiStyleContextValue | null>(null);

export interface FluentEmojiStyleProviderProps {
  /** Uncontrolled initial style (defaults to `'3d'`). */
  defaultStyle?: FluentEmojiStyle;
  /** Controlled style — pass to drive the value from the outside. */
  style?: FluentEmojiStyle;
  /** Notified with the newly chosen style; the consumer persists it. */
  onStyleChange?: (style: FluentEmojiStyle) => void;
  children?: React.ReactNode;
}

/**
 * Makes the Fluent artwork **style** ambient, reactive React state: every
 * `<FluentEmoji>` below (that doesn't pass its own `variant`) renders in the
 * provider's `style` and **re-renders when it changes** — the React-idiomatic way
 * to share a global preference, replacing the imperative module-global
 * {@link setFluentEmojiStyle} as the source of truth (it is still mirrored, so
 * non-React `fluentEmojiUrl` calls stay in sync, and stays the fallback when no
 * provider is mounted).
 *
 * Uncontrolled by default (`defaultStyle` + `onStyleChange`); pass `style` to
 * control it. The consumer owns persistence — wire `onStyleChange` to it.
 */
export function FluentEmojiStyleProvider({
  defaultStyle = '3d',
  style: controlled,
  onStyleChange,
  children,
}: FluentEmojiStyleProviderProps) {
  const [uncontrolled, setUncontrolled] =
    React.useState<FluentEmojiStyle>(defaultStyle);
  const isControlled = controlled !== undefined;
  const style = isControlled ? controlled : uncontrolled;

  const setStyle = React.useCallback(
    (next: FluentEmojiStyle) => {
      if (!isControlled) setUncontrolled(next);
      onStyleChange?.(next);
    },
    [isControlled, onStyleChange],
  );

  // Keep the module-global resolver default in step with the ambient style, so a
  // non-React `fluentEmojiUrl(...)` (or a FluentEmoji outside this provider)
  // still resolves the same artwork.
  React.useEffect(() => {
    setFluentEmojiStyle(style);
  }, [style]);

  const value = React.useMemo(() => ({ style, setStyle }), [style, setStyle]);
  return (
    <FluentEmojiStyleContext.Provider value={value}>
      {children}
    </FluentEmojiStyleContext.Provider>
  );
}

/**
 * Read + set the ambient Fluent style. Throws outside a
 * {@link FluentEmojiStyleProvider} — use it for the appearance control, not for
 * rendering (a bare `<FluentEmoji>` falls back gracefully via
 * {@link useAmbientFluentEmojiStyle}).
 */
export function useFluentEmojiStyle(): FluentEmojiStyleContextValue {
  const ctx = React.useContext(FluentEmojiStyleContext);
  if (!ctx) {
    throw new Error(
      'useFluentEmojiStyle must be used within <FluentEmojiStyleProvider>',
    );
  }
  return ctx;
}

/**
 * The ambient style, or `undefined` when no provider is mounted — the
 * non-throwing reader `<FluentEmoji>` uses so it renders anywhere (stories,
 * isolated tests) and only honours the provider when one exists.
 */
export function useAmbientFluentEmojiStyle(): FluentEmojiStyle | undefined {
  return React.useContext(FluentEmojiStyleContext)?.style;
}
