module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        '@nx/react/babel',
        {
          runtime: 'automatic',
          useBuiltIns: 'usage',
        },
      ],
    ],
    plugins: [],
    env: {
      test: {
        presets: ['babel-preset-expo'],
      },
    },
    // cssInterop applies only to JSX compiled through nativewind's runtime, as a NativeWind app compiles
    // every file; the engine-neutral files keep React's, so their specs see the className they set.
    overrides: [
      {
        test: /[.]nativewind[.]tsx$/,
        env: {
          test: {
            presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
          },
        },
      },
    ],
  };
};
