import { isMatch } from '@zeroxsolutions/routing';

import type { SiteNavItem } from '@/types/site-nav-item';

/**
 * The section `pathname` belongs to. Where several patterns match, the one listed last wins, because
 * the header lists a section before its subsections.
 */
export function currentSiteNavItem(items: SiteNavItem[], pathname: string): SiteNavItem | undefined {
  return items.findLast((item) => isMatch(item.pattern, pathname));
}
