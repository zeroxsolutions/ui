/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: '@zeroxsolutions/native-ui',
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  resolver: '<rootDir>/jest.resolver.cjs',
  // The CI gate runs these specs beside the native preview's Metro web exports, which take every core;
  // there a spec that settles an Animated value in well under a second locally ran past jest's 5s default.
  testTimeout: 30_000,
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  moduleNameMapper: {
    '[.]svg$': '@nx/expo/plugins/jest/svg-mock',
    // Icon, Input, Skeleton and the chart's theme have one file per engine, and the registry ships one of them as icon.tsx, input.tsx, skeleton.tsx and chart-theme.ts; the specs run NativeWind's.
    // A composed component under components/<category>/ imports Icon as ../../ui/icon.
    '^(?:[.]|[.][.]/[.][.]/ui)/icon$': '<rootDir>/src/registry/ui/icon.nativewind.tsx',
    '^[.]/input$': '<rootDir>/src/registry/ui/input.nativewind.tsx',
    '^[.]/skeleton$': '<rootDir>/src/registry/ui/skeleton.nativewind.tsx',
    '^[.]/chart-theme$': '<rootDir>/src/registry/ui/chart-theme.nativewind.ts',
    // The demos import the items as an app does; build-registry writes NativeWind's Vega sources there.
    '^@/(.*)$': '<rootDir>/dist/src/nativewind-vega/$1',
    // The preview imports each style's demos through `@styles/<style>/`, which each preview app points at
    // its engine's sources.
    '^@styles/([^/]+)/(.*)$': '<rootDir>/dist/src/nativewind-$1/$2',
  },
  // jest-expo's preset list plus lucide-react-native, @rn-primitives and d3's modules. Under pnpm a package sits in
  // a nested node_modules the preset leaves untransformed unless it names the package;
  // lucide-react-native's react-native build and d3's modules are ES modules, and @rn-primitives' dist holds raw JSX.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|d3-[a-z-]+|internmap|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|lucide-react-native|@rn-primitives))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  transform: {
    '[.]m?[jt]sx?$': [
      'babel-jest',
      {
        configFile: __dirname + '/.babelrc.js',
      },
    ],
    '^.+[.](bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf|m4v|mov|mp4|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|obj)$':
      require.resolve('jest-expo/src/preset/assetFileTransformer.js'),
  },
  coverageDirectory: '../../coverage/packages/native-ui',
};
