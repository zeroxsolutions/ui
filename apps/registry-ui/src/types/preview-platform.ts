import type { PREVIEW_PLATFORMS } from '@/constants/preview-platforms';

/** Where a native component page's preview shows its demo. */
export type PreviewPlatform = (typeof PREVIEW_PLATFORMS)[number];
