/**
 * The EAS project `apps/native-preview` publishes its updates to, one channel per native style, which
 * Expo Go opens a demo from. It is `null` until `eas init` creates the project and this takes the
 * project id that command writes into the preview app's config; while it is `null`, a native page
 * offers no way to open its demo on a phone.
 */
export const EXPO_PROJECT_ID: string | null = null;

/**
 * The Expo SDK the native preview is built on. Expo Go opens only an update built for its own SDK, so
 * this is the Expo Go a reader has to install; the spec of `expoGoUrl` fails while it differs from the
 * `expo` the workspace's catalog pins.
 */
export const EXPO_GO_SDK = 58;
