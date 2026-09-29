import * as React from 'react';

interface UseControllableStateOptions<T> {
  /** The controlled value; `undefined` leaves the state uncontrolled. */
  prop: T | undefined;
  /** The initial uncontrolled value. */
  defaultProp: T;
  /** Called with every value set, controlled or not. */
  onChange?: (value: T) => void;
}

/**
 * Controlled/uncontrolled state: uses `prop` when provided, otherwise an
 * internal state seeded from `defaultProp`, the Base UI and Radix triad.
 * Setting a value calls `onChange` in both modes and updates the internal
 * state only when uncontrolled.
 */
function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultProp);
  const controlled = prop !== undefined;
  const value = controlled ? (prop as T) : uncontrolled;
  const setValue = React.useCallback(
    (next: T) => {
      if (!controlled) setUncontrolled(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [value, setValue];
}

export { useControllableState };
export type { UseControllableStateOptions };
