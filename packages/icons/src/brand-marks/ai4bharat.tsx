import { Brain } from 'lucide-react';
import { lucideMark } from './lucide-mark';

/**
 * AI4Bharat has no published wordmark and no clean public SVG anywhere
 * (checked @lobehub/icons / Simple Icons / svgl / their site + GitHub), so per
 * the user's explicit call this stands in with a neutral brain glyph — a
 * deliberate placeholder, not a fabricated brand mark. Exposed as a standalone
 * mark so a provider→mark registry can stay a thin preset map.
 */
export const AI4BharatMark = lucideMark(Brain);
