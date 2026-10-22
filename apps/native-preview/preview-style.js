/**
 * The styles the preview draws, and the emitted sources of each, which Metro, Tailwind and the Expo
 * config read. One bundle holds every style: the web export takes the style from the page's address,
 * and a native update from `EXPO_PUBLIC_STYLE`, which Expo writes into the bundle.
 */
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

/** The styles the native registries are built in. */
const PREVIEW_STYLES = ['vega', 'nova'];

/** The native default, whose sources the app's own `@/` imports and the shared theme come from. */
const DEFAULT_STYLE = 'vega';

/**
 * @param {string | undefined} value - `process.env.EXPO_PUBLIC_STYLE`; `vega` when unset
 * @returns {'vega' | 'nova'}
 * @throws {Error} `EXPO_PUBLIC_STYLE is <value>; the native preview draws vega or nova` for any other value
 */
function previewStyle(value) {
  const style = value ?? DEFAULT_STYLE;
  if (style !== 'vega' && style !== 'nova') {
    throw new Error(`EXPO_PUBLIC_STYLE is ${style}; the native preview draws ${PREVIEW_STYLES.join(' or ')}`);
  }
  return style;
}

/**
 * The folder `@zeroxsolutions/native-ui:build-registry` writes NativeWind's sources of `style` to, laid
 * out as an app holds them after `shadcn add`, with the demos in `examples/`.
 * @param {'vega' | 'nova'} style
 * @returns {string}
 */
function previewSources(style) {
  const nativeUi = dirname(require.resolve('@zeroxsolutions/native-ui/package.json'));
  return join(nativeUi, 'dist/src', `nativewind-${style}`);
}

/**
 * The folder of native-ui's preview screen, which the app renders as its root and which imports the
 * emitted sources through `@/` as they do.
 * @returns {string}
 */
function previewScreenSources() {
  return join(dirname(require.resolve('@zeroxsolutions/native-ui/package.json')), 'src/preview');
}

/**
 * The theme file `name` the styles share, such as `global.css`: one stylesheet and one Tailwind theme
 * serve every style the bundle holds.
 * @param {string} name - a file the theme item writes into each style's sources
 * @returns {string} its path in the default style's sources
 * @throws {Error} `<name> differs between vega and nova; one bundle cannot draw both` when a style's copy differs
 */
function sharedThemeFile(name) {
  const [first, ...others] = PREVIEW_STYLES.map((style) => join(previewSources(style), name));
  const content = readFileSync(first, 'utf8');
  if (others.some((path) => readFileSync(path, 'utf8') !== content)) {
    throw new Error(`${name} differs between ${PREVIEW_STYLES.join(' and ')}; one bundle cannot draw both`);
  }
  return join(previewSources(DEFAULT_STYLE), name);
}

module.exports = { DEFAULT_STYLE, PREVIEW_STYLES, previewScreenSources, previewSources, previewStyle, sharedThemeFile };
