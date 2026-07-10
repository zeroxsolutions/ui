import { builtInNodeCodecs } from './built-in-codecs.js';
import {
  buildCodecRegistry,
  type CodecRegistry,
  type CodecRegistryOptions,
} from './codec-registry.js';
import type { EditorFeature } from '../core/types/feature.js';

/**
 * Build a codec registry from a feature set, seeded with the shipped built-in
 * substrate codecs. The Editor and both Viewers create it the same way so a
 * block serializes and renders consistently across every surface.
 */
export function createCodecRegistry(
  features: EditorFeature[] = [],
  options?: CodecRegistryOptions,
): CodecRegistry {
  return buildCodecRegistry(features, builtInNodeCodecs, options);
}
