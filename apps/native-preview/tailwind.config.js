const { PREVIEW_STYLES, previewSources, sharedThemeFile } = require('./preview-style');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind 4.2.7 reads `darkMode: ['class']` as dark mode off; the docs' installation page sets this.
  darkMode: ['class', '.dark'],
  content: [
    './index.js',
    './src/**/*.{ts,tsx}',
    ...PREVIEW_STYLES.map((style) => `${previewSources(style)}/**/*.{ts,tsx}`),
  ],
  presets: [require('nativewind/preset')],
  // What `shadcn add @zui/theme` merges into an app's Tailwind config.
  theme: require(sharedThemeFile('tailwind-theme.json')),
  plugins: [],
};
