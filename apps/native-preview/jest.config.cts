/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: '@zeroxsolutions/native-preview',
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    // The app's `@/` is NativeWind's Vega sources from build-registry, as tsconfig.app.json maps it.
    '^@/(.*)$': '<rootDir>/../../packages/native-ui/dist/src/nativewind-vega/$1',
  },
  // jest-expo's preset list plus lucide-react-native and @rn-primitives, which the sources import. Under
  // pnpm a package sits in a nested node_modules the preset leaves untransformed unless it names the
  // package; @rn-primitives' dist holds raw JSX.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|lucide-react-native|@rn-primitives))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  transform: {
    '[.][jt]sx?$': [
      'babel-jest',
      {
        configFile: __dirname + '/.babelrc.js',
      },
    ],
    '^.+[.](bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf|m4v|mov|mp4|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|obj)$':
      require.resolve('jest-expo/src/preset/assetFileTransformer.js'),
  },
  coverageDirectory: '../../coverage/apps/native-preview',
};
