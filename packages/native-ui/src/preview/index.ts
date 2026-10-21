/**
 * The screen each native preview app draws the demos in. The NativeWind and the Uniwind preview share
 * it because the docs site frames and links both the same way, by `?style=&demo=&theme=` on web and by
 * the path after `/--/` in Expo Go.
 */
export { Preview } from './preview';
export type { PreviewProps } from './preview';
export type { ColorScheme } from './preview-url';
