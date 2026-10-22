// Reanimated's Jest resolver, which hands Jest the web build of the Reanimated and Worklets modules that
// need a native module. Worklets' rule inside it takes any module whose directory path contains
// `react-native-worklets`, and pnpm names a package's `.pnpm` directory after its peers, so Reanimated's
// own modules, and css-interop's, would match and load web builds that need a DOM. The rules here read the
// path with that directory name hidden, and Jest resolves from the real one.
const reanimatedResolver = require('react-native-reanimated/jest/resolver');

const PNPM_PACKAGE_DIRECTORY = /([\\/]\.pnpm[\\/])[^\\/]+/;

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    basedir: options.basedir.replace(PNPM_PACKAGE_DIRECTORY, '$1package'),
    defaultResolver: (path, resolverOptions) =>
      options.defaultResolver(path, { ...resolverOptions, basedir: options.basedir }),
  });
