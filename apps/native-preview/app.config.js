const { previewStyle } = require('./preview-style');

/** Serves each style's export under the site's `/native-preview/<style>/`, where its assets load from. */
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: `/native-preview/${previewStyle(process.env.STYLE)}` },
});
