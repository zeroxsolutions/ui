// Expo installs these globals as lazy getters that load their module on first read, and Jest refuses
// that load once a test file is importing. Reading each here, before any test file loads, settles it.
const lazyGlobals = [
  'TextDecoderStream',
  'TextEncoderStream',
  'URL',
  'URLSearchParams',
  'DOMException',
  '__ExpoImportMetaRegistry',
  'structuredClone',
  'fetch',
];

for (const name of lazyGlobals) {
  void (globalThis as Record<string, unknown>)[name];
}

// Animations run on Jest's timers, and `toHaveAnimatedStyle` reads where they have got to.
require('react-native-reanimated').setUpTests();
