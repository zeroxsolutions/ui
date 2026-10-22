const { withNxMetro } = require('@nx/expo');
const { join, sep } = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const {
  DEFAULT_STYLE,
  PREVIEW_STYLES,
  previewScreenSources,
  previewSources,
  sharedThemeFile,
} = require('./preview-style');

const trees = PREVIEW_STYLES.map(previewSources);
/** The emitted sources and the preview screen, whose packages resolve from this app. */
const appSideTrees = [...trees, previewScreenSources()];
const appEntry = join(__dirname, 'index.js');
/** `@styles/<style>/<path>`, which the preview screen imports a style's demos through. */
const STYLE_ALIAS = /^@styles\/([^/]+)\/(.*)$/;

// global.css imports Vega's zui-theme.css for both styles; this throws if Nova's copy ever differs.
sharedThemeFile('zui-theme.css');

const config = withNxMetro(getDefaultConfig(__dirname));
const resolveUpstream = config.resolver.resolveRequest;

/**
 * `@/` is the importing file's style's sources, as an app's `@/` is its root, and the default style's
 * for the app's own files and the preview screen's. A package the sources, the demos or the preview
 * screen import resolves from this app, as it would in an app that installed them: from where the files
 * sit, it would be native-ui's own copy, a second React Native and a second Uniwind.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = resolveUpstream ?? context.resolveRequest;
  const originTree = trees.find((tree) => context.originModulePath.startsWith(tree + sep));
  const styled = STYLE_ALIAS.exec(moduleName);
  if (styled) {
    const [, style, path] = styled;
    return context.resolveRequest(context, join(previewSources(style), path), platform);
  }
  if (moduleName.startsWith('@/')) {
    const tree = originTree ?? previewSources(DEFAULT_STYLE);
    return context.resolveRequest(context, join(tree, moduleName.slice(2)), platform);
  }
  if (appSideTrees.some((tree) => context.originModulePath.startsWith(tree + sep)) && !moduleName.startsWith('.')) {
    return resolve({ ...context, originModulePath: appEntry }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});
