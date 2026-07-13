import { useId, useMemo } from 'react';

const kebab = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');

/**
 * A single per-instance unique SVG fill id (one gradient/clip). Adapted from
 * `@lobehub/icons`' `useFillId` (MIT), backed by React's `useId`.
 */
export const useFillId = (namespace: string) => {
  const uniqueId = useId();
  const id = `zx-icons-${kebab(namespace)}-${uniqueId}`;
  return useMemo(() => ({ fill: `url(#${id})`, id }), [id]);
};

/**
 * Per-instance unique SVG fill ids for gradient/clip-bearing `.Color` variants.
 * Adapted from `@lobehub/icons`' `useFillIds` (MIT), backed by React's `useId`
 * so multiple instances of the same mark on one page never share a gradient id —
 * the cross-instance isolation the icon-library contract requires. Internal to
 * `brands/`.
 */
export const useFillIds = (namespace: string, length: number) => {
  const uniqueId = useId();
  return useMemo(
    () =>
      Array.from({ length }, (_, i) => {
        const id = `zx-icons-${kebab(namespace)}-${i}-${uniqueId}`;
        return { fill: `url(#${id})`, id };
      }),
    [namespace, length, uniqueId],
  );
};
