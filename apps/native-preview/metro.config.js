const { withNxMetro } = require('@nx/expo');
const { join, sep } = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { previewSources, previewStyle } = require('./preview-style');

const sources = previewSources(previewStyle(process.env.STYLE));
const examples = join(require.resolve('@zeroxsolutions/native-ui/package.json'), '../src/examples');
const appEntry = join(__dirname, 'index.js');

const config = withNxMetro(getDefaultConfig(__dirname));
const resolveUpstream = config.resolver.resolveRequest;

/**
 * `@/` is the style's emitted sources, as an app's `@/` is its root. A package the sources or the demos
 * import resolves from this app, as it would in an app that installed them: from where the files sit,
 * it would be native-ui's own copy, a second React Native and Tailwind 4's tailwind-merge.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = resolveUpstream ?? context.resolveRequest;
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(context, join(sources, moduleName.slice(2)), platform);
  }
  const fromSourcesOrDemos = [sources, examples].some((folder) => context.originModulePath.startsWith(folder + sep));
  if (fromSourcesOrDemos && !moduleName.startsWith('.')) {
    return resolve({ ...context, originModulePath: appEntry }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: join(sources, 'global.css'), inlineRem: 16 });
