/**
 * The styles the preview draws, and the emitted sources of each, which Metro, Tailwind and the Expo
 * config read. One bundle holds every style: the web export takes the style from the page's address,
 * and a native update from `EXPO_PUBLIC_STYLE`, which Expo writes into the bundle.
 */
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

/** The styles the native registries are built in. */
const PREVIEW_STYLES = ['vega', 'luma', 'lyra', 'maia', 'mira', 'nova', 'rhea', 'sera'];

/** The native default, whose sources the app's own `@/` imports and the shared theme come from. */
const DEFAULT_STYLE = 'vega';

/**
 * @param {string | undefined} value - `process.env.EXPO_PUBLIC_STYLE`; `vega` when unset
 * @returns {string} one of {@link PREVIEW_STYLES}
 * @throws {Error} `EXPO_PUBLIC_STYLE is <value>; the native preview draws vega, luma, ...` for any other value
 */
function previewStyle(value) {
  const style = value ?? DEFAULT_STYLE;
  if (!PREVIEW_STYLES.includes(style)) {
    throw new Error(`EXPO_PUBLIC_STYLE is ${style}; the native preview draws ${PREVIEW_STYLES.join(', ')}`);
  }
  return style;
}

/**
 * The folder `@zeroxsolutions/native-ui:build-registry` writes NativeWind's sources of `style` to, laid
 * out as an app holds them after `shadcn add`, with the demos in `examples/`.
 * @param {string} style - one of {@link PREVIEW_STYLES}
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
 * @throws {Error} `<name> differs between the styles; one bundle cannot draw them all` when a style's copy differs
 */
function sharedThemeFile(name) {
  const [first, ...others] = PREVIEW_STYLES.map((style) => join(previewSources(style), name));
  const content = readFileSync(first, 'utf8');
  if (others.some((path) => readFileSync(path, 'utf8') !== content)) {
    throw new Error(`${name} differs between the styles; one bundle cannot draw them all`);
  }
  return join(previewSources(DEFAULT_STYLE), name);
}

module.exports = { DEFAULT_STYLE, PREVIEW_STYLES, previewScreenSources, previewSources, previewStyle, sharedThemeFile };
