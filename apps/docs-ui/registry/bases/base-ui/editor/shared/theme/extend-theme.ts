import type { DeepPartial, IEditorTheme } from './types/editor-theme.js';

/**
 * Extend a theme by overriding a subset of tokens (see the `editor-theming`
 * spec). Overridden tokens take effect; everything else falls back to the base.
 * For full replacement, just pass a different `IEditorTheme` to the provider.
 */
export function extendTheme(
  base: IEditorTheme,
  overrides: DeepPartial<IEditorTheme>,
): IEditorTheme {
  return deepMerge(base, overrides) as IEditorTheme;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return (source as T) ?? target;
  }
  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] =
      isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value as DeepPartial<typeof current>)
        : value;
  }
  return result as T;
}
