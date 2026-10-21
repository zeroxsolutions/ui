import type { NativeEngine } from '@/types/native-engine';

/**
 * The EAS project each engine's preview app publishes its updates to, one channel per native style, which
 * Expo Go opens a demo from: `extra.eas.projectId` in `apps/native-preview/app.json` for NativeWind and in
 * `apps/native-preview-uniwind/app.json` for Uniwind, each of which has to hold the same id. Set to
 * `null`, an engine's pages offer no way to open a demo on a phone.
 */
export const EXPO_PROJECT_IDS: Record<NativeEngine, string | null> = {
  nativewind: 'afb21ed5-e305-4bf1-ad02-1bc6d06853b1',
  uniwind: '613f58a3-a59a-4259-865a-19b01d7a8df9',
};

/**
 * The Expo SDK the native preview is built on. Expo Go opens only an update built for its own SDK, so
 * this is the Expo Go a reader has to install; the spec of `expoGoUrl` fails while it differs from the
 * `expo` the workspace's catalog pins.
 */
export const EXPO_GO_SDK = 58;
