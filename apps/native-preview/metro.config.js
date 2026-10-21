const { withNxMetro } = require('@nx/expo');
const { join, sep } = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { DEFAULT_STYLE, PREVIEW_STYLES, previewSources, sharedThemeFile } = require('./preview-style');

const trees = PREVIEW_STYLES.map(previewSources);
const appEntry = join(__dirname, 'index.js');
/** `@styles/<style>/<path>`, which the app imports a style's demos through. */
const STYLE_ALIAS = /^@styles\/([^/]+)\/(.*)$/;

const config = withNxMetro(getDefaultConfig(__dirname));
const resolveUpstream = config.resolver.resolveRequest;

/**
 * `@/` is the importing file's style's sources, as an app's `@/` is its root, and the default style's
 * for the app's own files. A package the sources or the demos import resolves from this app, as it
 * would in an app that installed them: from where the files sit, it would be native-ui's own copy, a
 * second React Native and Tailwind 4's tailwind-merge.
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
  if (originTree && !moduleName.startsWith('.')) {
    return resolve({ ...context, originModulePath: appEntry }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

// Beyond the docs' options: NativeWind otherwise adds nativewind-env.d.ts to tsconfig.json's `include`
// on every bundle, which nx's TypeScript sync then answers with a project reference. tsconfig.app.json
// lists the file instead.
module.exports = withNativeWind(config, {
  input: sharedThemeFile('global.css'),
  inlineRem: 16,
  disableTypeScriptGeneration: true,
});
