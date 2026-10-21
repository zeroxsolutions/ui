/**
 * The style the preview draws, chosen at build time by `STYLE`, and the emitted sources of that style
 * which the app's `@/` alias points at. Metro, Tailwind and the Expo config each read it, so one export
 * per style builds one app.
 */
const { dirname, join } = require('node:path');

/** The styles the native registries are built in; `vega` is the native default. */
const PREVIEW_STYLES = ['vega', 'nova'];

/**
 * @param {string | undefined} value - `process.env.STYLE`; `vega` when unset
 * @returns {'vega' | 'nova'}
 * @throws {Error} `STYLE is <value>; the native preview draws vega or nova` for any other value
 */
function previewStyle(value) {
  const style = value ?? 'vega';
  if (style !== 'vega' && style !== 'nova') {
    throw new Error(`STYLE is ${style}; the native preview draws ${PREVIEW_STYLES.join(' or ')}`);
  }
  return style;
}

/**
 * The folder `@zeroxsolutions/native-ui:build-registry` writes NativeWind's sources of `style` to, laid
 * out as an app holds them after `shadcn add`.
 * @param {'vega' | 'nova'} style
 * @returns {string}
 */
function previewSources(style) {
  const nativeUi = dirname(require.resolve('@zeroxsolutions/native-ui/package.json'));
  return join(nativeUi, 'dist/src', `nativewind-${style}`);
}

module.exports = { previewSources, previewStyle };
