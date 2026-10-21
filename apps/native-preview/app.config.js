const { previewStyle } = require('./preview-style');

// A native update is bundled in the one style the app reads from EXPO_PUBLIC_STYLE, so a value no
// style has fails the export here rather than in Expo Go.
previewStyle(process.env.EXPO_PUBLIC_STYLE);

/** Serves the web export under the site's `/native-preview/`, where its assets load from. */
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: '/native-preview' },
});
