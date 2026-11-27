// The data alone, for an app that cannot load the package root: the root also loads fluent-emoji-url, whose module
// body reads the module's own URL, which React Native's Babel leaves null, so the import crashes there.
export * from './lib/emoji-categories.js';
export * from './lib/emoji-manifest.js';
export * from './lib/emoji-to-unicode.js';
export type { FluentEmojiStyle } from './lib/fluent-emoji-url.js';
