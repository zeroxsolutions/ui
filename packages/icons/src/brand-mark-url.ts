/**
 * The brand-mark manifest and URL builder alone, without the DOM components, for a renderer that draws the marks
 * itself, such as the native registries over `expo-image`.
 */
export { BRAND_MARKS, type BrandMarkName } from './lib/brand-manifest';
export {
  DEFAULT_BRAND_MARK_BASE,
  brandMarkChain,
  brandMarkRatio,
  brandMarkUrlFor,
  type BrandMarkVariant,
} from './lib/brand-mark-url';
