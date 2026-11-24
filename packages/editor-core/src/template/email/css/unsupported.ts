/**
 * CSS that common mail clients drop, each entry a feature of caniemail.com's data (`https://www.caniemail.com/api/data.json`)
 * and the clients whose latest tested version it lists as unsupported.
 */

/** The day the table was read from caniemail.com; its data was last updated 2026-09-16. */
export const UNSUPPORTED_CSS_READ_ON = '2026-11-24';

/** One feature of the table. */
export interface UnsupportedCss {
  /** caniemail.com's slug for it, as in `https://www.caniemail.com/features/<feature>/`. */
  readonly feature: string;
  /** Whether a declaration uses it. `property` is lower case. */
  matches(property: string, value: string): boolean;
  readonly clients: readonly string[];
}

/** A `display` whose words, vendor prefix dropped, name `layout`: `flex`, `inline-flex`, `-webkit-flex`, `inline flex`. */
const DISPLAY = (layout: string) => (property: string, value: string) =>
  property === 'display' &&
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^-(?:webkit|moz|ms)-/, ''))
    .some((word) => word === layout || word === `inline-${layout}`);

/** Values that hand a property back to the cascade rather than set one. */
const CASCADE = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

/** One of `names` set to anything but the value that turns it off. */
const SET = (names: readonly string[], off: string) => (property: string, value: string) => {
  const word = value.trim().toLowerCase();
  return names.includes(property) && word !== off && !CASCADE.has(word);
};

const IN_BACKGROUND = (pattern: RegExp) => (property: string, value: string) =>
  (property === 'background' || property === 'background-image' || property === 'border-image') && pattern.test(value);

const MODERN_COLOR_CLIENTS = [
  'Gmail Desktop Webmail',
  'Gmail iOS',
  'Gmail Android',
  'Gmail Mobile Webmail',
  'Outlook Windows',
  'Outlook macOS',
  'Outlook Outlook.com',
  'Outlook iOS',
  'Outlook Android',
  'Yahoo! Mail Desktop Webmail',
  'Yahoo! Mail iOS',
  'Yahoo! Mail Android',
  'AOL Desktop Webmail',
  'AOL iOS',
  'AOL Android',
  'Samsung Email Android',
  'Mozilla Thunderbird macOS',
  'ProtonMail Android',
];

const FLEX_AND_GRID_CLIENTS = [
  'Orange Desktop Webmail',
  'Orange iOS',
  'Orange Android',
  'Outlook Windows',
  'Outlook Windows Mail',
  'GMX Desktop Webmail',
  'WEB.DE Desktop Webmail',
];

export const UNSUPPORTED_CSS: readonly UnsupportedCss[] = [
  { feature: 'css-display-flex', matches: DISPLAY('flex'), clients: FLEX_AND_GRID_CLIENTS },
  { feature: 'css-display-grid', matches: DISPLAY('grid'), clients: FLEX_AND_GRID_CLIENTS },
  {
    feature: 'css-position',
    matches: SET(['position'], 'static'),
    clients: [
      'Gmail Desktop Webmail',
      'Gmail iOS',
      'Gmail Android',
      'Gmail Mobile Webmail',
      'Outlook Windows',
      'Outlook Windows Mail',
      'Outlook iOS',
      'Mail.ru Desktop Webmail',
    ],
  },
  { feature: 'css-float', matches: SET(['float'], 'none'), clients: ['Outlook Windows', 'Outlook Windows Mail'] },
  {
    feature: 'css-transform',
    matches: SET(['transform', 'translate', 'rotate', 'scale'], 'none'),
    clients: [
      'Gmail Desktop Webmail',
      'Gmail iOS',
      'Gmail Android',
      'Gmail Mobile Webmail',
      'Orange Desktop Webmail',
      'Orange iOS',
      'Orange Android',
      'Outlook Windows',
      'Outlook Windows Mail',
      'Outlook macOS',
      'Outlook Outlook.com',
      'Outlook iOS',
      'Outlook Android',
      'Yahoo! Mail Desktop Webmail',
      'Yahoo! Mail iOS',
      'Yahoo! Mail Android',
      'AOL Desktop Webmail',
      'AOL iOS',
      'AOL Android',
      'Mail.ru Desktop Webmail',
      'GMX Desktop Webmail',
      'WEB.DE Desktop Webmail',
    ],
  },
  {
    feature: 'css-modern-color',
    matches: (_property, value) => /(?:^|[^\w-])(?:ok)?(?:lab|lch)\(/i.test(value),
    clients: MODERN_COLOR_CLIENTS,
  },
  {
    // caniemail.com has no entry for `color-mix()`; it is newer than the colour functions above, so a client
    // without those has none of it either, and it takes their list.
    feature: 'css-modern-color',
    matches: (_property, value) => /(?:^|[^\w-])color-mix\(/i.test(value),
    clients: MODERN_COLOR_CLIENTS,
  },
  {
    feature: 'css-linear-gradient',
    matches: IN_BACKGROUND(/linear-gradient\(/i),
    clients: [
      'Orange Desktop Webmail',
      'Orange iOS',
      'Orange Android',
      'Outlook Windows',
      'Outlook Windows Mail',
      'Outlook macOS',
      'Outlook Outlook.com',
      'Outlook iOS',
      'Outlook Android',
      'AOL Desktop Webmail',
      'AOL iOS',
      'AOL Android',
      'Yahoo! Mail Desktop Webmail',
      'Yahoo! Mail iOS',
      'Yahoo! Mail Android',
      'GMX Desktop Webmail',
      'WEB.DE Desktop Webmail',
    ],
  },
  {
    feature: 'css-radial-gradient',
    matches: IN_BACKGROUND(/radial-gradient\(/i),
    clients: [
      'Outlook Windows',
      'Outlook Windows Mail',
      'Outlook macOS',
      'Outlook Outlook.com',
      'Outlook iOS',
      'Outlook Android',
      'AOL Desktop Webmail',
      'AOL iOS',
      'AOL Android',
      'Yahoo! Mail Desktop Webmail',
      'Yahoo! Mail iOS',
      'Yahoo! Mail Android',
      'GMX Desktop Webmail',
      'WEB.DE Desktop Webmail',
    ],
  },
];

/**
 * A declaration of a product's stylesheet that common mail clients drop: where it is, what it says, and the
 * clients caniemail.com lists as dropping it.
 */
export interface StylesheetWarning {
  /** The index in the renderer's `css`. */
  readonly sheet: number;
  readonly line: number;
  readonly column: number;
  readonly property: string;
  readonly value: string;
  /** caniemail.com's slug for the feature. */
  readonly feature: string;
  readonly clients: readonly string[];
}

/** The table's entries a declaration uses, one per feature. */
export function unsupportedBy(property: string, value: string): UnsupportedCss[] {
  const found = UNSUPPORTED_CSS.filter((entry) => entry.matches(property.toLowerCase(), value));
  return found.filter((entry, index) => found.findIndex((other) => other.feature === entry.feature) === index);
}
