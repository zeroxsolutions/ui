const { previewStyle } = require('./preview-style');

/**
 * Serves the web export under the site's `/native-preview-uniwind/`, where its assets load from, and names the style a
 * native update draws: eas-cli writes this config into each update's manifest when it publishes, so one
 * export serves every style's update, each published with its own PREVIEW_STYLE. A value no style has
 * fails the publish here rather than in Expo Go.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: '/native-preview-uniwind' },
  extra: { ...config.extra, previewStyle: previewStyle(process.env.PREVIEW_STYLE) },
});
