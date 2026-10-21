import type { PLATFORM_STYLES } from '@/constants/platform-styles';

/** Which of the site's two trees a page belongs to: `web` under `/docs` and `/blocks`, `native` under `/native`. */
export type Platform = keyof typeof PLATFORM_STYLES;

/** A style a reader can pick on platform `P`, by its name after the engine or base prefix. */
export type PlatformStyle<P extends Platform = Platform> = (typeof PLATFORM_STYLES)[P][number];
