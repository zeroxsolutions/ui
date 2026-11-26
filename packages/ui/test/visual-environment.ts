/** The browser window every visual capture is drawn in, before a case narrows it to its own width. */
export const VISUAL_VIEWPORT = { width: 1280, height: 900 };

/** The instant the page's clock reads throughout a run, so a demo that prints a date prints the same one. */
export const VISUAL_CLOCK = '2026-01-15T09:30:00Z';

/** The themes every surface is captured in, as the theme switch offers them. */
export const VISUAL_THEMES = ['light', 'dark'] as const;
