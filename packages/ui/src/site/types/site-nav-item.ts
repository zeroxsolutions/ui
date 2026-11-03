/** One of the site's sections, as the header, the mobile menu and the command menu list it. */
export interface SiteNavItem {
  href: string;
  label: string;
  /** The pages the section covers, as a path-to-regexp pattern: `/docs{/*rest}` is `/docs` and every page under it. */
  pattern: string;
}
