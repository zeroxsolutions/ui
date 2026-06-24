import type { ComponentType } from 'react';

/**
 * Deepgram brand mark — vendored from Simple Icons (CC0) because the workspace's
 * standard set (`@lobehub/icons`) does not ship it. Replaces a stale
 * `Deepgram → workersai` fallback that stamped the Cloudflare mark on Deepgram's
 * speech models (and let `@cf/deepgram/flux` fall through to the FLUX mark).
 * A standalone mark so a provider→mark registry stays a thin preset map.
 * Monochrome (inherits `currentColor`), sized like the lobehub marks —
 * `size="1em"`, scaled by the consumer's wrapper.
 *
 * Source: github.com/simple-icons/simple-icons `icons/deepgram.svg`.
 */
export const DeepgramMark: ComponentType<{ size?: string | number }> = ({
  size = '1em',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path d="M11.203 24H1.517a.364.364 0 0 1-.258-.62l6.239-6.275a.366.366 0 0 1 .259-.108h3.52c2.723 0 5.025-2.127 5.107-4.845a5.004 5.004 0 0 0-4.999-5.148H7.613v4.646c0 .2-.164.364-.365.364H.968a.365.365 0 0 1-.363-.364V.364C.605.164.768 0 .969 0h10.416c6.684 0 12.111 5.485 12.01 12.187C23.293 18.77 17.794 24 11.202 24z" />
  </svg>
);
