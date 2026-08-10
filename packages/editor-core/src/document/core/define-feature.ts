import { EditorError } from './errors.js';
import type { EditorFeature } from './types/feature.js';

/**
 * The single declarative entry point for authoring a feature (see the
 * `editor-feature-api` spec). It bundles a block/mark with its behavior,
 * serialization, and UI, importing **only** this package — no engine type
 * anywhere. At authoring/registration time (a trust boundary, see `Validate at
 * Boundaries`) it does light structural validation, then returns the feature
 * unchanged; the compiler translates it to engine extensions later.
 */
export function defineFeature(feature: EditorFeature): EditorFeature {
  if (!feature.id || typeof feature.id !== 'string') {
    throw new EditorError(
      'editor.feature.invalid',
      'A feature must declare a non-empty string `id`.',
    );
  }

  const nodeNames = (feature.nodes ?? []).map((node) => node.name);
  const markNames = (feature.marks ?? []).map((mark) => mark.name);
  const seen = new Set<string>();
  for (const name of [...nodeNames, ...markNames]) {
    if (seen.has(name)) {
      throw new EditorError(
        'editor.feature.duplicate_type',
        `Feature "${feature.id}" declares the type "${name}" more than once.`,
      );
    }
    seen.add(name);
  }

  return feature;
}
