/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: '@zeroxsolutions/registry-native',
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  moduleNameMapper: {
    '[.]svg$': '@nx/expo/plugins/jest/svg-mock',
    // Icon has one file per engine, and the registry ships one of them as icon.tsx; the specs run NativeWind's.
    '^[.]/icon$': '<rootDir>/src/registry/ui/icon.nativewind.tsx',
  },
  // jest-expo's preset list plus lucide-react-native and @rn-primitives. Under pnpm a package sits in
  // a nested node_modules the preset leaves untransformed unless it names the package;
  // lucide-react-native's react-native build is ES modules and @rn-primitives' dist holds raw JSX.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|lucide-react-native|@rn-primitives))',
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
  coverageDirectory: '../../coverage/packages/registry-native',
};
