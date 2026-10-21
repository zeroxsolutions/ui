const { join } = require('node:path');
const { previewSources, previewStyle } = require('./preview-style');

const sources = previewSources(previewStyle(process.env.STYLE));
const examples = join(require.resolve('@zeroxsolutions/native-ui/package.json'), '../src/examples');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind 4.2.7 reads `darkMode: ['class']` as dark mode off; the docs' installation page sets this.
  darkMode: ['class', '.dark'],
  content: ['./index.js', './src/**/*.{ts,tsx}', `${sources}/**/*.{ts,tsx}`, `${examples}/**/*.tsx`],
  presets: [require('nativewind/preset')],
  // What `shadcn add @zui/theme` merges into an app's Tailwind config.
  theme: require(join(sources, 'tailwind-theme.json')),
  plugins: [],
};
