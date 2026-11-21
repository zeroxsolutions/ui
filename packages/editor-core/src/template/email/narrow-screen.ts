/**
 * The class names the default layout's narrow-screen rules select. Gmail drops a rule keyed by element or
 * id from a head style and keeps one keyed by class, so a block marks what a phone should resize this way.
 */
export const NARROW = {
  outer: 'zx-outer',
  card: 'zx-card',
  inner: 'zx-inner',
  text: 'zx-text',
  button: 'zx-button',
  lane: 'zx-lane',
} as const;

/**
 * Under 600px the card loses its frame and gutter and fills the screen, body text and the button grow to
 * 16px, the button spans the card, and lanes stack.
 */
export const NARROW_SCREEN_STYLE =
  '@media only screen and (max-width:600px){' +
  `.${NARROW.outer}{padding:0 !important;}` +
  `.${NARROW.card}{border:0 !important;border-radius:0 !important;}` +
  `.${NARROW.inner}{padding:24px 20px !important;}` +
  `.${NARROW.text}{font-size:16px !important;line-height:24px !important;}` +
  `.${NARROW.button}{display:block !important;text-align:center !important;font-size:16px !important;line-height:22px !important;padding:12px 16px !important;}` +
  `.${NARROW.lane}{display:block !important;width:100% !important;padding:0 !important;}` +
  '}';
