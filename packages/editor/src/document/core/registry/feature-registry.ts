import {
  DuplicateRegistrationError,
  EditorError,
  MissingFeatureDependencyError,
} from '../errors.js';
import type { EditorFeature } from '../types/feature.js';

/**
 * Resolve a feature set for registration (see the `editor-feature-api` spec):
 * reject duplicate ids, fail clearly when a declared `dependsOn` is absent or
 * cyclic, and return the features **topologically ordered** so a dependency is
 * always registered before the feature that needs it. Engine-free.
 */
export function resolveFeatures(features: EditorFeature[]): EditorFeature[] {
  const byId = new Map<string, EditorFeature>();
  for (const feature of features) {
    if (byId.has(feature.id)) {
      throw new DuplicateRegistrationError('feature', feature.id);
    }
    byId.set(feature.id, feature);
  }

  for (const feature of features) {
    for (const dependency of feature.dependsOn ?? []) {
      if (!byId.has(dependency)) {
        throw new MissingFeatureDependencyError(feature.id, dependency);
      }
    }
  }

  const ordered: EditorFeature[] = [];
  const done = new Set<string>();
  const onPath = new Set<string>();

  const visit = (feature: EditorFeature): void => {
    if (done.has(feature.id)) return;
    if (onPath.has(feature.id)) {
      throw new EditorError(
        'editor.feature.dependency_cycle',
        `Dependency cycle detected at feature "${feature.id}".`,
      );
    }
    onPath.add(feature.id);
    for (const dependency of feature.dependsOn ?? []) {
      visit(byId.get(dependency)!);
    }
    onPath.delete(feature.id);
    done.add(feature.id);
    ordered.push(feature);
  };

  for (const feature of features) visit(feature);
  return ordered;
}
